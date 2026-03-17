
// internalTransfer.js
import express from "express";
import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import TradingAccount from "../models/TradingAccount.js";
/* import Wallet from "../models/Wallet.js";
import TradingAccount from "../models/tradingAccountSchema.js"; */

const router = express.Router();

/*
================================================
INTERNAL TRANSFER API
POST /api/transfer/internal-transfer
================================================
*/

router.post("/internal-transfer", async (req, res) => {

  const { userId, fromAccount, toAccount, amount } = req.body;

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const transferAmount = Number(amount);

    /* ================================
        VALIDATION
    ================================ */

    if (!transferAmount || transferAmount <= 0) {
      throw new Error("Invalid transfer amount");
    }

    if (!fromAccount || !toAccount) {
      throw new Error("Both accounts must be selected");
    }

    if (fromAccount === toAccount) {
      throw new Error("Cannot transfer to the same account");
    }

    let fromBalance = 0;

    /* ================================
        HANDLE SOURCE ACCOUNT
    ================================ */

    if (fromAccount === "wallet") {

      const wallet = await Wallet.findOne({ userId }).session(session);

      if (!wallet) throw new Error("Wallet not found");

      fromBalance = wallet.balance;

      if (transferAmount > fromBalance || fromBalance <= 0) {
        throw new Error("Insufficient wallet balance");
      }

      wallet.balance -= transferAmount;

      await wallet.save({ session });

    } else {

      const fromTradingAccount = await TradingAccount.findOne({
        _id: fromAccount,
        userId,
        status: "Active"
      }).session(session);

      if (!fromTradingAccount) {
        throw new Error("Source trading account not found or inactive");
      }

      fromBalance = fromTradingAccount.balance;

      if (transferAmount > fromBalance || fromBalance <= 0) {
        throw new Error("Insufficient account balance");
      }

      fromTradingAccount.balance -= transferAmount;

      await fromTradingAccount.save({ session });
    }

    /* ================================
        HANDLE DESTINATION ACCOUNT
    ================================ */

    if (toAccount === "wallet") {

      const wallet = await Wallet.findOne({ userId }).session(session);

      if (!wallet) throw new Error("Wallet not found");

      wallet.balance += transferAmount;

      await wallet.save({ session });

    } else {

      const toTradingAccount = await TradingAccount.findOne({
        _id: toAccount,
        userId,
        status: "Active"
      }).session(session);

      if (!toTradingAccount) {
        throw new Error("Destination trading account not found or inactive");
      }

      toTradingAccount.balance += transferAmount;

      await toTradingAccount.save({ session });
    }

    /* ================================
        COMMIT TRANSACTION
    ================================ */

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Transfer completed successfully"
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    console.error("Internal Transfer Error:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;