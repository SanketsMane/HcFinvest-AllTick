import express from "express";
import User from "../models/User.js";

const router = express.Router();


// ==========================================
// ✅ GET USER BY ID
// ==========================================
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ==========================================
// ✅ UPDATE USER (ADMIN)
// ==========================================
router.put("/users/:id", async (req, res) => {
  try {
    const {
      firstName,
      email,
      phone,
      walletBalance,
      isBlocked,
      isBanned,
      blockReason,
      banReason,
      kycApproved,
      upiId,
      bankDetails
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ✅ Update fields safely
    if (firstName !== undefined) user.firstName = firstName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

    if (walletBalance !== undefined) user.walletBalance = walletBalance;

    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    if (blockReason !== undefined) user.blockReason = blockReason;

    if (isBanned !== undefined) user.isBanned = isBanned;
    if (banReason !== undefined) user.banReason = banReason;

    if (kycApproved !== undefined) user.kycApproved = kycApproved;

    if (upiId !== undefined) user.upiId = upiId;

    // ✅ Bank details merge
    if (bankDetails) {
      user.bankDetails = {
        ...user.bankDetails,
        ...bankDetails
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user
    });

  } catch (error) {
    console.error("Update error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ==========================================
// ✅ BLOCK / UNBLOCK USER (QUICK ACTION)
// ==========================================
router.patch("/users/:id/block", async (req, res) => {
  try {
    const { isBlocked, blockReason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked, blockReason },
      { new: true }
    );

    res.json({
      success: true,
      message: `User ${isBlocked ? "blocked" : "unblocked"}`,
      user
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ==========================================
// ✅ BAN / UNBAN USER
// ==========================================
router.patch("/users/:id/ban", async (req, res) => {
  try {
    const { isBanned, banReason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned, banReason },
      { new: true }
    );

    res.json({
      success: true,
      message: `User ${isBanned ? "banned" : "unbanned"}`,
      user
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ==========================================
// ✅ UPDATE WALLET BALANCE (ADMIN)
// ==========================================
router.patch("/users/:id/wallet", async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.walletBalance += Number(amount);

    await user.save();

    res.json({
      success: true,
      message: "Wallet updated",
      walletBalance: user.walletBalance
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


export default router;