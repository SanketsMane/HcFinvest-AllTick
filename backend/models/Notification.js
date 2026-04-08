
// Notification.js

import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: [
      'TRANSFER',
      'DEPOSIT',
      'WITHDRAWAL',
      'ACCOUNT',
      'ADMIN',
      'SYSTEM'
    ],
    default: 'SYSTEM'
  },

  isRead: {
    type: Boolean,
    default: false
  },

  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },

  meta: {
    type: Object,
    default: {}
  }

}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
