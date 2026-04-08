// //CompititionRoutes.js

// import express from "express";
// import mongoose from "mongoose"; //Sanket v2.0 - mongoose import was missing, total-winnings route was crashing
// import Competition from "../models/Compitition.js";
// import CompetitionParticipant from "../models/competitionParticipantSchema.js";
// import sendCompetitionEmail from "../services/sendCompetitionEmail.js"; //Sanket v2.0 - import email service to send emails from backend instead of relying on frontend
// import competitionJoinTemplate from "../scripts/CompetitionEmailTemplate.js"; //Sanket v2.0 - import email template for competition join

// const router = express.Router();


// // Calculate competition status

// const getCompetitionStatus = (startDate, endDate) => {

//   const now = new Date();

//   const start = new Date(startDate);
//   const end = new Date(endDate);

//   // Completed
//   if (end < now) {
//     return "completed";
//   }

//   // Upcoming
//   if (start > now) {
//     return "upcoming";
//   }

//   // Ongoing
//   return "live";

// };

// // DELETE COMPETITION
// router.delete("/delete/:id", async (req, res) => {

//   try {

//     const { id } = req.params;

//     const competition = await Competition.findByIdAndDelete(id);

//     if (!competition) {
//       return res.status(404).json({
//         success: false,
//         message: "Competition not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Competition deleted successfully"
//     });

//   } catch (error) {

//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });

//   }

// });

// router.post("/join/:competitionId", async (req, res) => {

//   try {

//     const { competitionId } = req.params;
//     const { userId } = req.body;

//     const competition = await Competition.findById(competitionId);

//     if (!competition) {
//       return res.status(404).json({ message: "Competition not found" });
//     }

//     competition.participants.push(userId);

//     await competition.save();

//     res.json({
//       success: true,
//       message: "Joined successfully"
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });

//   }

// });


// // GET ALL COMPETITIONS
// router.get("/getall", async (req, res) => {

//   try {

//     const competitions = await Competition.find();

//     res.json({
//       success: true,
//       data: competitions
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });

//   }

// });
  


// //  GET COMPETITION DETAILS BY ID - includes participants
// router.get("/:id", async (req, res) => {
//   try {

//     const competition = await Competition
//       .findById(req.params.id)
//       .populate("participants"); // optional if participants reference users

//     if (!competition) {
//       return res.status(404).json({
//         success: false,
//         message: "Competition not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: competition
//     });

//   } catch (error) {

//     console.error("Error loading competition:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });

//   }
// });


// // CREATE COMPETITION

// router.post("/create", async (req, res) => {

//   try {

//     const data = req.body;

//     const status = getCompetitionStatus(
//       data.startDate,
//       data.endDate
//     );

//     const competition = new Competition({
//       ...data,
//       competitionStatus: status
//     });

//     await competition.save();

//     res.status(201).json({
//       success: true,
//       message: "Competition created successfully",
//       data: competition
//     });

//   } catch (error) {

//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });

//   }

// });

// //Sanket v2.0 - removed first duplicate createParticipant route, keeping only the one below with proper validation and duplicate key handling
// router.post("/createParticipant", async (req, res) => {
//   try {
//     const {
//       competitionId,
//       userId,
//       participantName,
//       tradingAccountNumber,
//       initialDeposit
//     } = req.body;

//     console.log("Incoming Payload:", req.body);

//     // ✅ VALIDATION
//     if (!competitionId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "competitionId and userId are required"
//       });
//     }

//     // ✅ CHECK DUPLICATE
//     const existing = await CompetitionParticipant.findOne({
//       competitionId,
//       userId
//     });

//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: "User already joined this competition"
//       });
//     }

//     // ✅ CREATE PARTICIPANT (SAFE)
//     const participant = await CompetitionParticipant.create({
//       competitionId,
//       userId,
//       participantName,
//       tradingAccountNumber,
//       initialDeposit,
//       equity: initialDeposit,
//       profitLoss: 0,
//       roi: 0
//     });

//     console.log("Participant created:", participant);

//     //Sanket v2.0 - send competition join email from backend so it's guaranteed, not reliant on frontend call
//     try {
//       const competition = await Competition.findById(competitionId);
//       if (competition && req.body.email) {
//         const html = competitionJoinTemplate({
//           name: participantName,
//           competitionName: competition.competitionName,
//           startDate: competition.startDate,
//         });

//         await sendCompetitionEmail({
//           to: req.body.email,
//           subject: "🎉 Competition Joined Successfully",
//           html,
//         });
//         console.log("✅ Competition join email sent to:", req.body.email);
//       }
//     } catch (emailErr) {
//       //Sanket v2.0 - don't fail the join if email fails, just log it
//       console.error("⚠️ Email sending failed (non-blocking):", emailErr.message);
//     }

//     res.status(201).json({
//       success: true,
//       message: "Joined competition successfully",
//       participant
//     });

//   } catch (err) {
//     console.error("CREATE PARTICIPANT ERROR:", err);

//     // ✅ DUPLICATE KEY HANDLING
//     if (err.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "User already joined this competition"
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: err.message || "Server error"
//     });
//   }
// });


// // UPDATE COMPETITION
// router.put("/update/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const data = req.body;

//     // 🔥 Recalculate status
//     const status = getCompetitionStatus(
//       data.startDate,
//       data.endDate
//     );

//     const updatedCompetition = await Competition.findByIdAndUpdate(
//       id,
//       {
//         ...data,
//         competitionStatus: status
//       },
//       { new: true } // return updated data
//     );

//     if (!updatedCompetition) {
//       return res.status(404).json({
//         success: false,
//         message: "Competition not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Competition updated successfully",
//       data: updatedCompetition
//     });

//   } catch (error) {
//     console.error("UPDATE ERROR:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// });



// export default router;



// CompititionRoutes.js

import express from "express";
import Competition from "../models/Compitition.js";
import CompetitionParticipant from "../models/competitionParticipantSchema.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

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
        message: "Competition not found",
      });
    }

    res.json({
      success: true,
      message: "Competition deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/join/:competitionId", async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { userId } = req.body;

    const competition = await Competition.findById(competitionId);

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    competition.participants.push(userId);

    await competition.save();

    res.json({
      success: true,
      message: "Joined successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET ALL COMPETITIONS
router.get("/getall", async (req, res) => {
  try {
    const competitions = await Competition.find();

    res.json({
      success: true,
      data: competitions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

//  GET COMPETITION DETAILS BY ID - includes participants
router.get("/:id", async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id).populate(
      "participants",
    ); // optional if participants reference users

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    res.status(200).json({
      success: true,
      data: competition,
    });
  } catch (error) {
    console.error("Error loading competition:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// CREATE COMPETITION
/* 
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
 */
/* 
router.post("/create", async (req, res) => {
  try {
    const data = req.body;

    const status = getCompetitionStatus(data.startDate, data.endDate);

    const competition = new Competition({
      ...data,
      competitionStatus: status,
    });

    await competition.save();

    // 🔔 CREATE NOTIFICATION FOR ALL USERS
    try {
      const users = await User.find({}, "_id");

      if (users.length > 0) {
        const notifications = users.map((user) => ({
          userId: user._id,
          title: "New Competition Available 🚀",
          message: `New competition "${competition.competitionName}" is now available. Join now!`,
          type: "SYSTEM",
          meta: {
            competitionId: competition._id,
          },
        }));

        await Notification.insertMany(notifications);

        console.log("✅ Competition Notifications Sent");
      }

      // ⚡ SOCKET SAFE CHECK
      const io = req.app.get("io");

      if (io) {
        users.forEach((user) => {
          io.to(user._id.toString()).emit("newNotification", {
            title: "New Competition Available 🚀",
            message: `New competition "${competition.competitionName}" is now available.`,
          });
        });
      }
    } catch (err) {
      console.error("❌ Notification Error:", err.message);
    }

    res.status(201).json({
      success: true,
      message: "Competition created successfully",
      data: competition,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
 */

router.post("/create", async (req, res) => {
  try {
    const data = req.body;

    const status = getCompetitionStatus(data.startDate, data.endDate);

    const competition = new Competition({
      ...data,
      competitionStatus: status,
    });

    await competition.save();

// 🔔 SEND NOTIFICATION ONLY IF LIVE
try {
  if (status === "live") {
    const users = await User.find().select("_id");

    if (users.length > 0) {
      const notifications = users.map((user) => ({
        userId: user._id,
        title: "Competition Started 🚀",
        message: `Competition "${competition.competitionName}" is now LIVE. Join now!`,
        type: "SYSTEM",
        meta: {
          competitionId: competition._id,
        },
        isRead: false,
      }));

      // ✅ BULK INSERT
      await Notification.insertMany(notifications, { ordered: false });

      console.log("✅ Live Competition Notifications Sent:", notifications.length);
    }

    // ⚡ SOCKET EMIT
    const io = req.app.get("io");

    if (io) {
      users.forEach((user) => {
        io.to(user._id.toString()).emit("newNotification", {
          _id: `${competition._id}-${user._id}`,
          title: "Competition Started 🚀",
          message: `Competition "${competition.competitionName}" is LIVE now!`,
          createdAt: new Date().toISOString(),
          isRead: false,
          meta: {
            competitionId: competition._id,
          },
        });
      });
    }
  }
} catch (notifError) {
  console.error("❌ Notification Error:", notifError.message);
}

    res.status(201).json({
      success: true,
      message: "Competition created successfully",
      data: competition,
    });
  } catch (error) {
    console.error("CREATE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/createParticipant", async (req, res) => {
  try {
    const {
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit,
    } = req.body;

    // ❗ Prevent duplicate join
    const existing = await CompetitionParticipant.findOne({
      competitionId,
      userId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already joined this competition",
      });
    }

    const participant = new CompetitionParticipant({
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit,
      equity: initialDeposit, // start equity = deposit
      profitLoss: 0,
      roi: 0,
    });

    await participant.save();

    res.status(201).json({
      success: true,
      message: "Joined competition successfully",
      participant,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* 
router.post("/createParticipant", async (req, res) => {
  try {
    const {
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit,
    } = req.body;

    console.log("Incoming Payload:", req.body);

    // ✅ VALIDATION
    if (!competitionId || !userId) {
      return res.status(400).json({
        success: false,
        message: "competitionId and userId are required",
      });
    }

    // ✅ CHECK DUPLICATE
    const existing = await CompetitionParticipant.findOne({
      competitionId,
      userId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already joined this competition",
      });
    }

    // ✅ CREATE PARTICIPANT (SAFE)
    const participant = await CompetitionParticipant.create({
      competitionId,
      userId,
      participantName,
      tradingAccountNumber,
      initialDeposit,
      equity: initialDeposit,
      profitLoss: 0,
      roi: 0,
    });

    console.log("Participant created:", participant);

    res.status(201).json({
      success: true,
      message: "Joined competition successfully",
      participant,
    });
  } catch (err) {
    console.error("CREATE PARTICIPANT ERROR:", err);

    // ✅ DUPLICATE KEY HANDLING
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already joined this competition",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});
 */

// UPDATE COMPETITION
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = req.body;

    // 🔥 Recalculate status
    const status = getCompetitionStatus(data.startDate, data.endDate);

    const updatedCompetition = await Competition.findByIdAndUpdate(
      id,
      {
        ...data,
        competitionStatus: status,
      },
      { new: true }, // return updated data
    );

    // 🔔 NOTIFY WHEN BECOMES LIVE
if (status === "live") {
  try {
    const users = await User.find().select("_id");
    const io = req.app.get("io");

    users.forEach((user) => {
      io?.to(user._id.toString()).emit("newNotification", {
        title: "Competition Started 🚀",
        message: `Competition "${updatedCompetition.competitionName}" is now LIVE!`,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    });

    console.log("✅ Live update notification sent");
  } catch (err) {
    console.error("❌ Live update notification error:", err.message);
  }
}

    if (!updatedCompetition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    res.json({
      success: true,
      message: "Competition updated successfully",
      data: updatedCompetition,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
