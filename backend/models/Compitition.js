import mongoose from "mongoose";

const prizeSchema = new mongoose.Schema({
  rank: {
    type: Number,
    required: true
  },
  prizeAmount: {
    type: String,
    required: true
  }
});

const competitionSchema = new mongoose.Schema({

  competitionName: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  competitionType: {
    type: String,
    default: "trading"
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  maxParticipants: {
    type: Number,
    required: true
  },

  entryFee: {
    type: Number,
    required: true
  },

  totalPrizePool: {
    type: String,
    required: true
  },

  competitionRules: {
    type: String,
    required: true
  },

  bannerImage: String,

  isPublic: {
    type: Boolean,
    default: true
  },

  requiresKYC: {
    type: Boolean,
    default: false
  },

  allowMultipleEntries: {
    type: Boolean,
    default: false
  },

  competitionStatus: {
    type: String,
    enum: ["upcoming", "live", "completed"],
    default: "upcoming"
  },

  prizeDistribution: [prizeSchema],

  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]

}, { timestamps: true });

export default mongoose.model("Competition", competitionSchema);