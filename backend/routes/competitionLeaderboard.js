import express from "express";
import axios from "axios"; // ✅ FIX: use axios instead of fetch
import Trade from "../models/Trade.js";
import competitionParticipantSchema from "../models/competitionParticipantSchema.js";

const router = express.Router();

/**
 * 🔥 GET LEADERBOARD
 * URL: /api/competition/leaderboard/:competitionId
 */
router.get("/leaderboard/:competitionId", async (req, res) => {
  try {
    const { competitionId } = req.params;

    // ✅ 1. Get participants
    const participants = await competitionParticipantSchema
      .find({ competitionId })
      .populate("userId", "firstName email");

    if (!participants.length) {
      return res.json({ success: true, leaderboard: [] });
    }

    // ✅ 2. Extract userIds
    const userIds = participants.map((p) => p.userId?._id);

    // ✅ 3. Fetch ALL OPEN TRADES
    const trades = await Trade.find({
      userId: { $in: userIds },
      status: "OPEN",
      isChallengeAccount: true,
    });

    // ✅ 4. Get symbols
    const symbols = [...new Set(trades.map((t) => t.symbol))];

    // ✅ 5. Fetch LIVE PRICES (SAFE)
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
      const uid = trade.userId.toString();
      if (!tradesByUser[uid]) tradesByUser[uid] = [];
      tradesByUser[uid].push(trade);
    });

    // ✅ 7. Calculate P&L
    const updatedParticipants = [];

    for (const participant of participants) {
      const uid = participant.userId?._id?.toString();

      if (!uid) continue;

      const userTrades = tradesByUser[uid] || [];
      let totalPnl = 0;

      for (const trade of userTrades) {
        const prices = livePrices[trade.symbol];

        // ✅ SAFE PRICE CHECK
        if (!prices || !prices.bid || !prices.ask) continue;

        let pnl = 0;

        // ✅ SAFE PnL CALCULATION (FIX FOR 500 ERROR)
        if (typeof trade.calculatePnl === "function") {
          pnl = trade.calculatePnl(prices.bid, prices.ask);
        } else {
          if (trade.type === "BUY") {
            pnl = (prices.bid - trade.openPrice) * (trade.lotSize || 1);
          } else {
            pnl = (trade.openPrice - prices.ask) * (trade.lotSize || 1);
          }
        }

        totalPnl += pnl;
      }

      const initialDeposit = participant.initialDeposit || 1;

      const roi = (totalPnl / initialDeposit) * 100;
      const equity = initialDeposit + totalPnl;

      participant.profitLoss = totalPnl;
      participant.roi = roi;
      participant.equity = equity;

      updatedParticipants.push(participant);
    }

    // ✅ 8. Sort by ROI
    updatedParticipants.sort((a, b) => b.roi - a.roi);

    // ✅ 9. Assign rank
    updatedParticipants.forEach((p, index) => {
      p.rank = index + 1;
    });

    // ✅ 10. SAFE SAVE (no crash)
    await Promise.all(
      updatedParticipants.map(async (p) => {
        try {
          await p.save();
        } catch (err) {
          console.error("Save error:", err.message);
        }
      })
    );

    // ✅ 11. Final response
    const leaderboard = updatedParticipants.map((p) => ({
      userId: p.userId?._id?.toString(),
      name: p.userId?.firstName || "Trader",
      email: p.userId?.email || "",
      profitLoss: p.profitLoss || 0,
      roi: p.roi || 0,
      equity: p.equity || 0,
      rank: p.rank || 0,
    }));

    return res.json({
      success: true,
      leaderboard,
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
    const participants = await competitionParticipantSchema.find({
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