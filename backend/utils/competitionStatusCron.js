import cron from "node-cron";
import mongoose from "mongoose";
import axios from "axios";
import Competition from "../models/Compitition.js";
import CompetitionParticipant from "../models/competitionParticipantSchema.js";
import TradingAccount from "../models/TradingAccount.js";
import Trade from "../models/Trade.js";

// ✅ Status Logic
const getCompetitionStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < now) return "completed";
  if (start > now) return "upcoming";
  return "live";
};

// Sync Leaderboard Data to DB
const syncCompetitionLeaderboard = async (competitionId) => {
  try {
    const participants = await CompetitionParticipant.find({ competitionId });
    if (!participants.length) return;

    const demoAccounts = await TradingAccount.find({ competitionId });
    const accountIdList = demoAccounts.map((acc) => acc._id);

    const accountUserIdMap = {};
    demoAccounts.forEach((acc) => {
      accountUserIdMap[acc._id.toString()] = acc.userId.toString();
    });

    const trades = await Trade.find({
      tradingAccountId: { $in: accountIdList },
      status: { $in: ["OPEN", "CLOSED"] }
    });

    const openTrades = trades.filter((t) => t.status === "OPEN");
    const symbols = [...new Set(openTrades.map((t) => t.symbol))];

    let livePrices = {};
    try {
      if (symbols.length > 0) {
        const priceRes = await axios.post(`${process.env.PRICE_API_URL}/prices/batch`, { symbols });
        if (priceRes.data?.success && priceRes.data?.prices) {
          livePrices = priceRes.data.prices;
        }
      }
    } catch (err) {
      console.error("Cron price fetch error:", err.message);
    }

    const tradesByUser = {};
    trades.forEach((trade) => {
      const accId = trade.tradingAccountId.toString();
      const uid = accountUserIdMap[accId];
      if (uid) {
        if (!tradesByUser[uid]) tradesByUser[uid] = [];
        tradesByUser[uid].push(trade);
      }
    });

    for (const participant of participants) {
      const uid = participant.userId.toString();
      const userTrades = tradesByUser[uid] || [];
      let totalPnl = 0;

      for (const trade of userTrades) {
        if (trade.status === "CLOSED") {
          totalPnl += parseFloat(trade.realizedPnl || 0);
        } else if (trade.status === "OPEN") {
          const prices = livePrices[trade.symbol];
          if (!prices || !prices.bid || !prices.ask) continue;
          let pnl = 0;
          if (typeof trade.calculatePnl === "function") {
            pnl = trade.calculatePnl(prices.bid, prices.ask);
          } else {
            pnl = (trade.side === "BUY" || trade.type === "BUY") 
              ? (prices.bid - trade.openPrice) * (trade.lotSize || 1)
              : (trade.openPrice - prices.ask) * (trade.lotSize || 1);
          }
          totalPnl += pnl;
        }
      }

      const initialDeposit = participant.initialDeposit || 1;
      participant.roi = (totalPnl / initialDeposit) * 100;
      participant.profitLoss = totalPnl;
      participant.equity = initialDeposit + totalPnl;
    }

    // Sort by ROI descending
    participants.sort((a, b) => b.roi - a.roi);
    
    // Write rank bounds
    participants.forEach((p, index) => {
      p.rank = index + 1;
    });

    await Promise.all(participants.map(p => p.save()));
    console.log(`✅ Synced leaderboard for competition ${competitionId}`);
  } catch (err) {
    console.error("Sync Leaderboard Error:", err.message);
  }
};

// ✅ EVERY MINUTE CRON
cron.schedule("* * * * *", async () => {
  // console.log("🔥 MINUTE CRON STARTED:", new Date());

  try {
    const competitions = await Competition.find();

    for (let comp of competitions) {
      const newStatus = getCompetitionStatus(comp.startDate, comp.endDate);
      const isStatusChanged = comp.competitionStatus !== newStatus;

      if (isStatusChanged) {
        console.log(`Competition ${comp.competitionName} status changing: ${comp.competitionStatus} -> ${newStatus}`);
        comp.competitionStatus = newStatus;
        await comp.save();

        if (newStatus === "completed") {
          try {
            await TradingAccount.updateMany(
              { competitionId: comp._id, isCompetition: true },
              { $set: { status: "Archived" } }
            );
            console.log(`✅ Archived all demo accounts for competition ${comp.competitionName}`);
          } catch (archiveErr) {
            console.error("Error archiving accounts:", archiveErr);
          }
        }
      }

      // Sync leaderboard periodically for live competitions OR one last time when it just completed
      if (newStatus === "live" || (isStatusChanged && newStatus === "completed")) {
        await syncCompetitionLeaderboard(comp._id);
      }
    }

  } catch (error) {
    console.error("❌ CRON ERROR:", error);
  }
});