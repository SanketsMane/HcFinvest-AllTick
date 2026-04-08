
// import express from "express";
// import Wallet from "../models/Wallet.js";
// import TradingAccount from "../models/TradingAccount.js";
// import Transaction from "../models/Transaction.js";

// const router = express.Router();

// router.post("/internal-transfer", async (req, res) => {

//   console.log("🚀 STEP 1: API HIT");

//   const { userId, fromAccount, toAccount, amount } = req.body;

//   console.log("📦 STEP 2: Request Data:", {
//     userId,
//     fromAccount,
//     toAccount,
//     amount
//   });

//   try {

//     const transferAmount = Number(amount);

//     /* ========================
//        VALIDATION
//     ======================== */

//     if (!transferAmount || transferAmount <= 0) {
//       throw new Error("Invalid amount");
//     }

//     if (!fromAccount || !toAccount) {
//       throw new Error("Select accounts");
//     }

//     if (fromAccount === toAccount) {
//       throw new Error("Same account not allowed");
//     }

//     /* ========================
//        FETCH SOURCE
//     ======================== */

//     let fromWallet = null;
//     let fromTrading = null;

//     if (fromAccount === "wallet") {

//       fromWallet = await Wallet.findOne({ userId });
//       if (!fromWallet) throw new Error("Wallet not found");

//       if (fromWallet.balance < transferAmount) {
//         throw new Error("Insufficient wallet balance");
//       }

//       fromWallet.balance -= transferAmount;
//       await fromWallet.save();

//     } else {

//       fromTrading = await TradingAccount.findById(fromAccount);
//       if (!fromTrading) throw new Error("Source account not found");

//       // ✅ SECURITY CHECK
//       if (fromTrading.userId.toString() !== userId) {
//         throw new Error("Unauthorized access");
//       }

//       if (fromTrading.balance < transferAmount) {
//         throw new Error("Insufficient balance");
//       }

//       fromTrading.balance -= transferAmount;
//       await fromTrading.save();
//     }

//     /* ========================
//        FETCH DESTINATION
//     ======================== */

//     let toWallet = null;
//     let toTrading = null;

//     if (toAccount === "wallet") {

//       toWallet = await Wallet.findOne({ userId });
//       if (!toWallet) throw new Error("Wallet not found");

//       toWallet.balance += transferAmount;
//       await toWallet.save();

//     } else {

//       toTrading = await TradingAccount.findById(toAccount);
//       if (!toTrading) throw new Error("Destination account not found");

//       // ✅ SECURITY CHECK
//       if (toTrading.userId.toString() !== userId) {
//         throw new Error("Unauthorized access");
//       }

//       toTrading.balance += transferAmount;
//       await toTrading.save();
//     }

//     /* ========================
//        TRANSACTION HISTORY
//     ======================== */

//     console.log("🧾 STEP 15: Saving transaction");

//     // ✅ Wallet → Account
//     if (fromAccount === "wallet" && toAccount !== "wallet") {

//       await Transaction.create({
//         userId,
//         type: "Transfer_To_Account",
//         amount: transferAmount,
//         paymentMethod: "Internal",
//         tradingAccountId: toAccount,
//         toAccountNumber: toTrading?.accountId || String(toTrading?._id),
//         fromAccount: "wallet",
//         status: "Completed"
//       });
//     }

//     // ✅ Account → Wallet
//     else if (fromAccount !== "wallet" && toAccount === "wallet") {

//       await Transaction.create({
//         userId,
//         type: "Transfer_From_Account",
//         amount: transferAmount,
//         paymentMethod: "Internal",
//         tradingAccountId: fromAccount,
//         fromAccountNumber: fromTrading?.accountId || String(fromTrading?._id),
//         toAccount: "wallet",
//         status: "Completed"
//       });
//     }

//     // ✅ Account → Account
//     else {

//       await Transaction.create([
//         {
//           userId,
//           type: "Account_Transfer_Out",
//           amount: transferAmount,
//           paymentMethod: "Internal",
//           fromTradingAccountId: fromAccount,
//           toTradingAccountId: toAccount,
//           fromAccountNumber: fromTrading?.accountId || String(fromTrading?._id),
//           toAccountNumber: toTrading?.accountId || String(toTrading?._id),
//           status: "Completed"
//         },
//         {
//           userId,
//           type: "Account_Transfer_In",
//           amount: transferAmount,
//           paymentMethod: "Internal",
//           fromTradingAccountId: fromAccount,
//           toTradingAccountId: toAccount,
//           fromAccountNumber: fromTrading?.accountId || String(fromTrading?._id),
//           toAccountNumber: toTrading?.accountId || String(toTrading?._id),
//           status: "Completed"
//         }
//       ]);
//     }

//     console.log("✅ STEP 16: Transfer completed");

//     res.json({
//       success: true,
//       message: "Transfer completed successfully"
//     });

//   } catch (err) {

//     console.error("🔥 ERROR:", err.message);

//     res.status(400).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// export default router;


import express from "express";
import Wallet from "../models/Wallet.js";
import TradingAccount from "../models/TradingAccount.js";
import Transaction from "../models/Transaction.js";
import colors from "colors";
import createNotification from "../services/notificationServices.js";

const router = express.Router();

router.post("/internal-transfer", async (req, res) => {
  console.log("🚀 STEP 1: API HIT".bgGreen);

  const { userId, fromAccount, toAccount, amount } = req.body;

  console.log("📦 STEP 2: Request Data:".bgGreen, {
    userId,
    fromAccount,
    toAccount,
    amount,
  });

  try {
    // ✅ Normalize values (IMPORTANT FIX)
    const normalizedFrom = fromAccount?.trim().toLowerCase();
    const normalizedTo = toAccount?.trim().toLowerCase();

    console.log("🔍 CONDITION CHECK:", {
      normalizedFrom,
      normalizedTo,
      isWalletToAccount:
        normalizedFrom === "wallet" && normalizedTo !== "wallet",
      isAccountToWallet:
        normalizedFrom !== "wallet" && normalizedTo === "wallet",
    });

    if (!userId) {
      throw new Error("userId missing");
    }

    const transferAmount = Number(amount);

    /* ========================
       VALIDATION
    ======================== */

    if (!transferAmount || transferAmount <= 0) {
      throw new Error("Invalid amount");
    }

    if (!fromAccount || !toAccount) {
      throw new Error("Select accounts");
    }

    if (fromAccount === toAccount) {
      throw new Error("Same account not allowed");
    }

    /* ========================
       FETCH SOURCE
    ======================== */

    let fromWallet = null;
    let fromTrading = null;

    if (normalizedFrom === "wallet") {
      fromWallet = await Wallet.findOne({ userId });
      if (!fromWallet) throw new Error("Wallet not found");

      if (fromWallet.balance < transferAmount) {
        throw new Error("Insufficient wallet balance");
      }

      fromWallet.balance -= transferAmount;
      await fromWallet.save();
    } else {
      fromTrading = await TradingAccount.findById(fromAccount);
      if (!fromTrading) throw new Error("Source account not found");

      if (fromTrading.userId.toString() !== userId) {
        throw new Error("Unauthorized access");
      }

      if (fromTrading.balance < transferAmount) {
        throw new Error("Insufficient balance");
      }

      fromTrading.balance -= transferAmount;
      await fromTrading.save();
    }

    /* ========================
       FETCH DESTINATION
    ======================== */

    let toWallet = null;
    let toTrading = null;

    if (normalizedTo === "wallet") {
      toWallet = await Wallet.findOne({ userId });
      if (!toWallet) throw new Error("Wallet not found");

      toWallet.balance += transferAmount;
      await toWallet.save();
    } else {
      toTrading = await TradingAccount.findById(toAccount);
      if (!toTrading) throw new Error("Destination account not found");

      if (toTrading.userId.toString() !== userId) {
        throw new Error("Unauthorized access");
      }

      toTrading.balance += transferAmount;
      await toTrading.save();
    }

    /* ========================
       TRANSACTION HISTORY
    ======================== */

    console.log("🧾 STEP 15: Saving transaction".bgGreen);

    // ✅ Wallet → Account
    if (normalizedFrom === "wallet" && normalizedTo !== "wallet") {
      console.log("✅ ENTERED Wallet → Account BLOCK");

      const toAccountData = await TradingAccount.findById(toAccount);

      const transaction = await Transaction.create({
        userId,
        type: "Transfer_To_Account",
        amount: transferAmount,
        paymentMethod: "Internal",
        tradingAccountId: toAccount,
        toAccountNumber: toAccountData?.accountId || "Unknown",
        fromAccount: "wallet",
        status: "Completed",
      });

      console.log("📢 CALLING createNotification...");

      await createNotification({
        req, // 🔥 PASS REQUEST
        userId,
        type: "TRANSFER",
        title: "Transfer Successful",
        message: `₹${transferAmount} transferred...`,
        transactionId: transaction._id,
      });
    }

    // ✅ Account → Wallet
    else if (normalizedFrom !== "wallet" && normalizedTo === "wallet") {
      console.log("✅ ENTERED Account → Wallet BLOCK");

      const transaction = await Transaction.create({
        userId,
        type: "Transfer_From_Account",
        amount: transferAmount,
        paymentMethod: "Internal",
        tradingAccountId: fromAccount,
        fromAccountNumber: fromTrading?.accountId || String(fromTrading?._id),
        toAccount: "wallet",
        status: "Completed",
      });

      console.log("📢 CALLING createNotification...");

      await createNotification({
        req,
        userId,
        type: "TRANSFER",
        title: "Transfer Successful",
        message: `₹${transferAmount} received from trading account ${fromTrading?.accountId} to Wallet`,
        transactionId: transaction._id,
      });
    }

    // ✅ Account → Account
    else {
      console.log("✅ ENTERED Account → Account BLOCK");

      const transactions = await Transaction.create([
        {
          userId,
          type: "Account_Transfer_Out",
          amount: transferAmount,
          paymentMethod: "Internal",
          fromTradingAccountId: fromAccount,
          toTradingAccountId: toAccount,
          fromAccountNumber: fromTrading?.accountId || String(fromTrading?._id),
          toAccountNumber: toTrading?.accountId || String(toTrading?._id),
          status: "Completed",
        },
        {
          userId,
          type: "Account_Transfer_In",
          amount: transferAmount,
          paymentMethod: "Internal",
          fromTradingAccountId: fromAccount,
          toTradingAccountId: toAccount,
          fromAccountNumber: fromTrading?.accountId || String(fromTrading?._id),
          toAccountNumber: toTrading?.accountId || String(toTrading?._id),
          status: "Completed",
        },
      ]);

      console.log("📢 CALLING createNotification...");

      await createNotification({
        req,
        userId,
        type: "TRANSFER",
        title: "Internal Transfer Completed",
        message: `₹${transferAmount} transferred from ${fromTrading?.accountId} to ${toTrading?.accountId}`,
        transactionId: transactions[0]._id,
      });
    }

    console.log("✅ STEP 16: Transfer completed".bgGreen);

    res.json({
      success: true,
      message: "Transfer completed successfully",
    });
  } catch (err) {
    console.error(`🔥 ERROR: ${err.message}`.bgRed);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
