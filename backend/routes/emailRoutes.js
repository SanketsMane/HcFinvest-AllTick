import express from "express";
import competitionJoinTemplate from "../services/CompetitionEmailTemplate.js";
import emailService from "../services/emailService.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/competition-join", authMiddleware, async (req, res) => {
  try {
    const { competitionName, startDate } = req.body;
    const recipientEmail = req.user?.email;
    const recipientName = req.user?.firstName || 'Trader';

    if (!recipientEmail || !competitionName) {
      return res.status(400).json({ success: false, message: "Missing email context or competition name" });
    }

    const html = competitionJoinTemplate({
      name: recipientName,
      competitionName,
      startDate,
    });

    await emailService.sendEmail({
      to: recipientEmail,
      toName: recipientName,
      userId: req.user?._id,
      subject: "🎉 Competition Joined Successfully",
      html,
      category: 'notification',
      metadata: { type: 'competition_join', competitionName }
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Email failed" });
  }
});

export default router;