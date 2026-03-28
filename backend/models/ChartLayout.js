import mongoose from 'mongoose';

const ChartLayoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    index: true,
    default: 'GLOBAL' // 'GLOBAL' can be used if users want a single layout for all symbols
  },
  layoutJson: {
    type: Object,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to quickly find user's layout for a specific symbol
ChartLayoutSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const ChartLayout = mongoose.model('ChartLayout', ChartLayoutSchema);

export default ChartLayout;
