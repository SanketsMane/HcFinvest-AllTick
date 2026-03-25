import cron from "node-cron";
import mongoose from "mongoose";
import Competition from "../models/Compitition.js";

// ✅ Status Logic
const getCompetitionStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < now) return "completed";
  if (start > now) return "upcoming";
  return "live";
};

// ✅ DAILY CRON (12:00 AM)
cron.schedule("0 0 * * *", async () => {
  console.log("🔥 DAILY CRON STARTED:", new Date());

  try {
    const competitions = await Competition.find();

    for (let comp of competitions) {
      const newStatus = getCompetitionStatus(
        comp.startDate,
        comp.endDate
      );

      console.log("------");
      console.log("Competition:", comp.competitionName);
      console.log("Old Status:", comp.competitionStatus);
      console.log("New Status:", newStatus);

      if (comp.competitionStatus !== newStatus) {
        comp.competitionStatus = newStatus;
        await comp.save();

        console.log("✅ UPDATED IN DATABASE");
      } else {
        console.log("❌ NO CHANGE");
      }
    }

    console.log("✅ DAILY CRON COMPLETED\n");

  } catch (error) {
    console.error("❌ CRON ERROR:", error);
  }
});