import express from "express";
import axios from "axios"; // ✅ FIX: use axios instead of fetch
import Trade from "../models/Trade.js";
import TradingAccount from "../models/TradingAccount.js";
import CompetitionParticipant from "../models/competitionParticipantSchema.js";

const router = express.Router();

/**
 * 🔥 GET LEADERBOARD
 * URL: /api/competition/leaderboard/:competitionId
 */
router.get("/leaderboard/:competitionId", async (req, res) => {
  try {
    const { competitionId } = req.params;

    // ✅ 1. Get participants
    const participants = await CompetitionParticipant
      .find({ competitionId })
      .populate("userId", "firstName email");

    if (!participants.length) {
      return res.json({ success: true, leaderboard: [] });
    }

    // ✅ 2. Identify the Demo Trading Accounts for this specific competition
    const demoAccounts = await TradingAccount.find({ competitionId });
    const accountIdList = demoAccounts.map((acc) => acc._id);

    // Map account back to user for easy lookup
    const accountUserIdMap = {};
    demoAccounts.forEach((acc) => {
      accountUserIdMap[acc._id.toString()] = acc.userId.toString();
    });

    // ✅ 3. Fetch BOTH OPEN AND CLOSED trades exclusively for these accounts
    const trades = await Trade.find({
      tradingAccountId: { $in: accountIdList },
      status: { $in: ["OPEN", "CLOSED"] }
    });

    // ✅ 4. Get unique symbols for live price fetch
    const openTrades = trades.filter((t) => t.status === "OPEN");
    const symbols = [...new Set(openTrades.map((t) => t.symbol))];

    // ✅ 5. Fetch LIVE PRICES for open trades
    let livePrices = {};
    try {
      if (symbols.length > 0) {
        const priceRes = await axios.post(
          `${process.env.PRICE_API_URL}/prices/batch`,
          { symbols }
        );
        const priceData = priceRes.data;
        if (priceData?.success && priceData?.prices) {
          livePrices = priceData.prices;
        }
      }
    } catch (err) {
      console.error("❌ Price fetch error:", err.message);
    }

    // ✅ 6. Group trades by user
    const tradesByUser = {};
    trades.forEach((trade) => {
      const accId = trade.tradingAccountId.toString();
      const uid = accountUserIdMap[accId];
      if (uid) {
        if (!tradesByUser[uid]) tradesByUser[uid] = [];
        tradesByUser[uid].push(trade);
      }
    });

    // ✅ 7. Calculate Realized + Floating P&L Dynamically (READ-ONLY)
    const leaderboardData = [];

    for (const participant of participants) {
      const uid = participant.userId?._id?.toString();
      if (!uid) continue;

      const userTrades = tradesByUser[uid] || [];
      let totalPnl = 0;

      for (const trade of userTrades) {
        if (trade.status === "CLOSED") {
          // Accumulate Realized Profits
          totalPnl += parseFloat(trade.realizedPnl || 0);
        } else if (trade.status === "OPEN") {
          // Calculate Floating Profits dynamically
          const prices = livePrices[trade.symbol];
          if (!prices || !prices.bid || !prices.ask) continue;

          let pnl = 0;
          if (typeof trade.calculatePnl === "function") {
            pnl = trade.calculatePnl(prices.bid, prices.ask);
          } else {
            if (trade.side === "BUY" || trade.type === "BUY") {
              pnl = (prices.bid - trade.openPrice) * (trade.lotSize || 1);
            } else {
              pnl = (trade.openPrice - prices.ask) * (trade.lotSize || 1);
            }
          }
          totalPnl += pnl;
        }
      }

      const initialDeposit = participant.initialDeposit || 1;
      const roi = (totalPnl / initialDeposit) * 100;
      const equity = initialDeposit + totalPnl;

      leaderboardData.push({
        userId: uid,
        name: participant.userId?.firstName || "Trader",
        email: participant.userId?.email || "",
        profitLoss: totalPnl,
        roi: roi,
        equity: equity,
      });
    }

    // ✅ 8. Sort by ROI
    leaderboardData.sort((a, b) => b.roi - a.roi);

    // ✅ 9. Assign dynamic rank
    leaderboardData.forEach((p, index) => {
      p.rank = index + 1;
    });

    // We DO NOT save these dynamic calculations to the database here!
    // This removes the DDOS vulnerability.

    return res.json({
      success: true,
      leaderboard: leaderboardData,
    });

  } catch (error) {
    console.error("❌ Leaderboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
});



router.get("/total-winnings/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    // ✅ Get all competition participations of user
    const participants = await CompetitionParticipant.find({
      userId: clientId,
    });

    if (!participants.length) {
      return res.json({
        success: true,
        totalWinnings: 0,
      });
    }

    let totalWinnings = 0;

    // ✅ Loop and sum winnings
    for (const p of participants) {
      // 👉 assuming prize stored here
      if (p.prize) {
        totalWinnings += p.prize;
      }
    }

    return res.json({
      success: true,
      totalWinnings,
    });

  } catch (error) {
    console.error("❌ Total Winnings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

export default router;