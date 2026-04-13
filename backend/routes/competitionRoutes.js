//CompititionRoutes.js

import express from "express";
import mongoose from "mongoose";
import Competition from "../models/Compitition.js";
import CompetitionParticipant from "../models/competitionParticipantSchema.js";
import User from "../models/User.js";
import emailService from "../services/emailService.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import TradingAccount from "../models/TradingAccount.js";
import AccountType from "../models/AccountType.js";

const router = express.Router();


// Calculate competition status

const getCompetitionStatus = (startDate, endDate) => {

  const now = new Date();

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Completed
  if (end < now) {
    return "completed";
  }

  // Upcoming
  if (start > now) {
    return "upcoming";
  }

  // Ongoing
  return "live";

};

// DELETE COMPETITION
router.delete("/delete/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const competition = await Competition.findByIdAndDelete(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found"
      });
    }

    res.json({
      success: true,
      message: "Competition deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

// SINGLE ATOMIC JOIN ENDPOINT
router.post("/join-competition", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { competitionId, userId } = req.body;

    if (!competitionId || !userId) {
      return res.status(400).json({ success: false, message: "competitionId and userId are required" });
    }

    const competition = await Competition.findById(competitionId).session(session);
    if (!competition) {
      throw new Error("Competition not found");
    }

    const user = await User.findById(userId).select("firstName email").session(session);
    if (!user) {
      throw new Error("User not found");
    }

    // 1. Check if already joined
    const alreadyJoined = (competition.participants || []).some((participantId) => String(participantId) === String(userId));
    if (alreadyJoined) {
      throw new Error("User already joined this competition");
    }

    // 2. Check & Deduct Wallet Balance
    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }

    const entryFee = competition.entryFee || 0;
    if (wallet.balance < entryFee) {
      throw new Error("Insufficient wallet balance for entry fee");
    }

    if (entryFee > 0) {
      wallet.balance -= entryFee;
      await wallet.save({ session });

      const transaction = new Transaction({
        userId,
        walletId: wallet._id,
        type: 'Withdrawal', 
        amount: entryFee,
        status: 'Completed',
        notes: `Entry Fee for Competition: ${competition.competitionName}`
      });
      await transaction.save({ session });
    }

    // 3. Mark User in Competition
    competition.participants.push(userId);
    await competition.save({ session });

    // 4. Create Trading Account (Demo) linked to Competition
    const demoType = await AccountType.findOne({ isDemo: true }).session(session);
    if (!demoType) {
      throw new Error("No demo account type available in the system.");
    }

    const accountId = await TradingAccount.generateAccountId();
    const initialDeposit = competition.initialDeposit || 10000;

    const tradingAccount = new TradingAccount({
      userId,
      accountTypeId: demoType._id,
      accountId,
      accountName: "Competition Account - " + competition.competitionName,
      isCompetition: true,
      competitionId: competition._id,
      pin: "0000",
      balance: initialDeposit,
      credit: 0,
      leverage: demoType.leverage || "1:100",
      exposureLimit: demoType.exposureLimit || 0,
      isDemo: true
    });
    await tradingAccount.save({ session });

    // Log the account creation
    await Transaction.create([{
      userId,
      type: 'Demo_Credit',
      amount: initialDeposit,
      paymentMethod: 'System',
      tradingAccountId: tradingAccount._id,
      tradingAccountName: tradingAccount.accountId,
      status: 'Completed',
      transactionRef: `COMPDEMO${Date.now()}`,
      notes: `Competition demo account credit for ${competition.competitionName}`
    }], { session });

    // 5. Create Competition Participant metadata
    const participant = new CompetitionParticipant({
      competitionId,
      userId,
      participantName: user.firstName || "Trader",
      tradingAccountNumber: tradingAccount.accountId,
      initialDeposit,
      equity: initialDeposit,
      profitLoss: 0,
      roi: 0
    });
    await participant.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 6. Send Email Confirmation async
    emailService.sendCompetitionJoinEmail({
      to: user.email,
      toName: user.firstName,
      userId: user._id,
      competitionName: competition.competitionName,
      startDate: competition.startDate
    }).catch((emailError) => {
      console.error("Competition join email failed:", emailError.message);
    });

    res.status(201).json({
      success: true,
      message: "Successfully joined the competition",
      participant,
      account: tradingAccount
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("JOIN COMPETITION ERROR:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to join competition" });
  }
});


// GET ALL COMPETITIONS
router.get("/getall", async (req, res) => {

  try {

    const competitions = await Competition.find();

    res.json({
      success: true,
      data: competitions
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});
  


//  GET COMPETITION DETAILS BY ID - includes participants
router.get("/:id", async (req, res) => {
  try {

    const competition = await Competition
      .findById(req.params.id)
      .populate("participants"); // optional if participants reference users

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found"
      });
    }

    res.status(200).json({
      success: true,
      data: competition
    });

  } catch (error) {

    console.error("Error loading competition:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// CREATE COMPETITION

router.post("/create", async (req, res) => {

  try {

    const data = req.body;

    const status = getCompetitionStatus(
      data.startDate,
      data.endDate
    );

    const competition = new Competition({
      ...data,
      competitionStatus: status
    });

    await competition.save();

    res.status(201).json({
      success: true,
      message: "Competition created successfully",
      data: competition
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

// DELETED OLD INSECURE ROUTES


// UPDATE COMPETITION
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = req.body;

    // 🔥 Recalculate status
    const status = getCompetitionStatus(
      data.startDate,
      data.endDate
    );

    const updatedCompetition = await Competition.findByIdAndUpdate(
      id,
      {
        ...data,
        competitionStatus: status
      },
      { new: true } // return updated data
    );

    if (!updatedCompetition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found"
      });
    }

    res.json({
      success: true,
      message: "Competition updated successfully",
      data: updatedCompetition
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



export default router;