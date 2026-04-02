import express from "express";
import sendCompetitionEmail from "../services/sendCompetitionEmail.js";
import competitionJoinTemplate from "../scripts/CompetitionEmailTemplate.js";

const router = express.Router();

//Sanket v2.0 - added input validation to prevent open email relay abuse (security fix)
router.post("/competition-join", async (req, res) => {
  try {
    const { email, name, competitionName, startDate } = req.body;

    //Sanket v2.0 - validate required fields and email format before sending
    if (!email || !name || !competitionName || !startDate) {
      return res.status(400).json({ success: false, message: "Missing required fields: email, name, competitionName, startDate" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    //Sanket v2.0 - sanitize name and competitionName to prevent HTML injection in email template
    const safeName = String(name).replace(/[<>]/g, '').slice(0, 100);
    const safeCompetitionName = String(competitionName).replace(/[<>]/g, '').slice(0, 200);

    const html = competitionJoinTemplate({
      name: safeName,
      competitionName: safeCompetitionName,
      startDate,
    });

    await sendCompetitionEmail({
      to: email,
      subject: "🎉 Competition Joined Successfully",
      html,
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Email failed" });
  }
});

export default router;