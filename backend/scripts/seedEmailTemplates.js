/**
 * //Sanket v2.0 - Unified production email template seeder
 * Seeds ALL platform email templates into the EmailTemplate collection.
 * Safe to re-run — uses upsert (update if slug exists, create if not).
 *
 * Usage:
 *   cd backend
 *   node scripts/seedEmailTemplates.js
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import EmailTemplate from '../models/EmailTemplate.js'

// ──────────────────────────────────────────────────────────────────────────────
// HC Finvest branded HTML shell — replicates the exact production email layout
// Logo → Heading → Body → CTA → Sign-off → Risk Warning → Footer
// ──────────────────────────────────────────────────────────────────────────────

const LOGO_URL = 'https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee'
const PREVIEW_TEXT = 'Trade with 0.0 spreads and zero commission today.'

//Sanket v2.0 - Shared branded shell keeps every email visually consistent with HC Finvest identity
function hcfShell(heading, bodyHTML, opts = {}) {
  const showCTA = opts.showCTA !== false
  const ctaText = opts.ctaText || 'Log In to Your Account'
  const ctaUrl = opts.ctaUrl || 'https://trade.hcfinvest.com/user/login'

  return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta content="width=device-width" name="viewport" />
  <link rel="preload" as="image" href="${LOGO_URL}" />
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta content="IE=edge" http-equiv="X-UA-Compatible" />
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
    ${PREVIEW_TEXT}
  </div>

  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
    <tbody><tr><td align="center" style="padding:20px;">

      <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;border:3px solid #1f2f5a;border-radius:10px;overflow:hidden;">
        <tbody>

          <!-- LOGO -->
          <tr>
            <td style="padding:0;margin:0;">
              <img alt="HC Finvest" height="120" src="${LOGO_URL}"
                style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black;width:100%;max-width:600px;" width="600" />
            </td>
          </tr>

          <!-- HEADING -->
          <tr>
            <td align="center" style="padding:10px 20px;text-align:center;">
              <h2 style="margin:10px 0;color:#1f2f5a;font-size:20px;">${heading}</h2>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:20px 30px;color:#333;font-size:14px;line-height:1.6;">
              ${bodyHTML}
              ${showCTA ? `
              <div style="margin:30px 0;text-align:center;">
                <span style="color:#ffffff;background:#1f2f5a;padding:12px 28px;border-radius:25px;display:inline-block;font-size:14px;">
                  <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer nofollow"
                    style="color:#ffffff;text-decoration:none;">${ctaText}</a>
                </span>
              </div>` : ''}
              <p style="margin:0;">If you need any assistance, our 24/5 support team is always here to help.</p>
              <p style="margin:10px 0 0;"><br/></p>
              <p style="margin:0;">Regards,<br/><strong>HC Finvest (Heddge Capitals Wealth Management LLC)</strong><br/>support@heddgecapitals.com<br/>www.hcfinvest.com</p>
            </td>
          </tr>

          <!-- RISK WARNING -->
          <tr>
            <td style="padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee;">
              <p style="margin:0;"><strong>Risk warning:</strong> Forex and CFD trading carry a high level of risk and may not be suitable for all investors. These instruments are complex and involve the use of leverage, which can amplify both gains and losses. Before engaging in trading, you should carefully consider your investment objectives, level of experience, and risk appetite. There is a possibility that you could sustain a loss of some or all of your invested capital, and therefore you should not invest money that you cannot afford to lose. You are strongly advised to seek independent financial advice before making any trading decisions. HC Finvest (Heddge Capitals) does not guarantee any profits and is not liable for any losses incurred. Trading should only be undertaken by individuals who fully understand the risks involved.</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px;">
              <p style="margin:0;">© 2026 Heddge Capitals Wealth Management LLC.<br/>All rights reserved.<br/>
                <a href="https://www.hcfinvest.com/privacyPolicies" target="_blank" rel="noopener noreferrer nofollow" style="color:#067df7;text-decoration:none;">Privacy Policy</a> |
                <a href="https://www.hcfinvest.com/" target="_blank" rel="noopener noreferrer nofollow" style="color:#067df7;text-decoration:none;">hcfinvest.com</a>
              </p>
            </td>
          </tr>

        </tbody>
      </table>

    </td></tr></tbody>
  </table>
</body>
</html>`
}

//Sanket v2.0 - Helper to build a styled detail table used across transaction/status emails
function detailTable(rows) {
  const rowsHTML = rows.map(([label, value]) =>
    `<tr><td style="padding:8px 12px;font-weight:bold;color:#555;border-bottom:1px solid #eee;width:40%;">${label}</td><td style="padding:8px 12px;color:#333;border-bottom:1px solid #eee;">${value}</td></tr>`
  ).join('')
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #ddd;border-radius:6px;background:#f9fafc;border-collapse:collapse;">${rowsHTML}</table>`
}

//Sanket v2.0 - Reusable OTP code block that matches the original signup email style
function otpBlock() {
  return `<div style="text-align:center;margin:20px 0;">
    <span style="font-size:28px;letter-spacing:8px;font-weight:bold;color:#1f2f5a;background:#f1f3f8;padding:12px 20px;border-radius:8px;display:inline-block;">{{otp}}</span>
  </div>`
}


// ──────────────────────────────────────────────────────────────────────────────
// TEMPLATE DEFINITIONS — ALL platform emails in one place
// ──────────────────────────────────────────────────────────────────────────────

const defaultTemplates = [

  // ═══════════════ OTP TEMPLATES ═══════════════

  {
    name: 'OTP - Signup',
    slug: 'otp-signup',
    subject: 'Your Verification Code - HC Finvest',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent during user signup',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: hcfShell('Email Verification - HC Finvest', `
      <p>Thank you for registering with our application. We're thrilled to have you on board.</p>
      <p>Your One-Time Password (OTP) is:</p>
      ${otpBlock()}
      <p>This OTP is valid for <strong>{{expiry_minutes}}</strong> minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `)
  },

  {
    name: 'OTP - Login',
    slug: 'otp-login',
    subject: 'Login Verification Code - HC Finvest',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent during user login',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: hcfShell('Login Verification - HC Finvest', `
      <p>A login attempt was made on your account. Please use the OTP below to verify your identity.</p>
      <p>Your One-Time Password (OTP) is:</p>
      ${otpBlock()}
      <p>This OTP is valid for <strong>{{expiry_minutes}}</strong> minutes.</p>
      <p>If you did not attempt to log in, please change your password immediately and contact support.</p>
    `)
  },

  {
    name: 'OTP - Password Reset',
    slug: 'otp-password_reset',
    subject: 'Password Reset OTP - HC Finvest',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent for password reset',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: hcfShell('Password Reset - HC Finvest', `
      <p>We received a request to reset your password. Please use the following OTP to proceed.</p>
      <p>Your One-Time Password (OTP) is:</p>
      ${otpBlock()}
      <p>This OTP is valid for <strong>{{expiry_minutes}}</strong> minutes.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support.</p>
    `)
  },

  {
    name: 'OTP - Email Change',
    slug: 'otp-email_change',
    subject: 'Email Change Verification - HC Finvest',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent when user requests email change',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: hcfShell('Email Change Verification - HC Finvest', `
      <p>You have requested to change the email address associated with your account. Please verify this action.</p>
      <p>Your One-Time Password (OTP) is:</p>
      ${otpBlock()}
      <p>This OTP is valid for <strong>{{expiry_minutes}}</strong> minutes.</p>
      <p>If you did not request this change, please secure your account immediately.</p>
    `)
  },

  {
    name: 'OTP - Verification',
    slug: 'otp-verification',
    subject: 'Verification Code - HC Finvest',
    category: 'authentication',
    isSystem: true,
    description: 'Generic OTP email for email verification',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: hcfShell('Email Verification - HC Finvest', `
      <p>Please use the following OTP to verify your email address.</p>
      <p>Your One-Time Password (OTP) is:</p>
      ${otpBlock()}
      <p>This OTP is valid for <strong>{{expiry_minutes}}</strong> minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `)
  },

  // ═══════════════ WELCOME & PASSWORD RESET ═══════════════

  {
    name: 'Welcome Email',
    slug: 'welcome',
    subject: 'Welcome to HC Finvest! 🎉',
    category: 'transactional',
    isSystem: true,
    description: 'Welcome email sent after successful registration',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email address', example: 'john@example.com' },
      { key: 'password', description: 'User password', example: '********' }
    ],
    htmlContent: hcfShell('Welcome to HC Finvest! 🎉', `
      <p>Hello <strong>{{user_name}}</strong>,</p>
      <p>Welcome to HC Finvest! Your account has been successfully created and you're all set to start trading.</p>
      <p><strong>Your Account Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Password', '{{password}}']
      ])}
      <p>For your security, please change your password after your first login.</p>
    `)
  },

  {
    name: 'Password Reset Link',
    slug: 'password-reset',
    subject: 'Reset Your Password - HC Finvest',
    category: 'authentication',
    isSystem: true,
    description: 'Password reset link email',
    placeholders: [
      { key: 'reset_url', description: 'Password reset URL', example: 'https://trade.hcfinvest.com/reset?token=xxx' },
      { key: 'expiry_minutes', description: 'Link expiry time in minutes', example: '60' }
    ],
    htmlContent: hcfShell('Reset Your Password', `
      <p>We received a request to reset your password. Click the button below to create a new password.</p>
      <p>This link will expire in <strong>{{expiry_minutes}} minutes</strong>.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support.</p>
    `, { ctaText: 'Reset Password', ctaUrl: '{{reset_url}}' })
  },

  // ═══════════════ DEPOSIT & WITHDRAWAL TEMPLATES ═══════════════

  {
    name: 'Deposit Request',
    slug: 'deposit-request',
    subject: 'Deposit Request Received - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a deposit request is received from a user.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'amount', description: 'Deposit amount', example: '$500' },
      { key: 'method', description: 'Payment method', example: 'Bank Transfer' },
      { key: 'txn_id', description: 'Transaction ID', example: 'TXN123456' }
    ],
    htmlContent: hcfShell('Deposit Request Received', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your deposit request has been successfully received and is currently under review.</p>
      <p><strong>Deposit Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Amount', '{{amount}}'],
        ['Payment Method', '{{method}}'],
        ['Transaction ID', '{{txn_id}}'],
        ['Status', '<span style="color:#e67e22;font-weight:bold;">Pending</span>']
      ])}
      <p style="margin-top:20px;"><strong>Note:</strong> For your security, please change your password after your first login.</p>
    `)
  },

  {
    name: 'Withdrawal Request',
    slug: 'withdrawal-request',
    subject: 'Withdrawal Request Received - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a withdrawal request is received from a user.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'amount', description: 'Withdrawal amount', example: '$500' },
      { key: 'method', description: 'Payment method', example: 'Bank Transfer' },
      { key: 'txn_id', description: 'Transaction ID', example: 'TXN123456' }
    ],
    htmlContent: hcfShell('Withdrawal Request Received', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your withdrawal request has been successfully received and is currently being processed.</p>
      <p><strong>Withdrawal Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Amount', '{{amount}}'],
        ['Payment Method', '{{method}}'],
        ['Transaction ID', '{{txn_id}}'],
        ['Status', '<span style="color:#e67e22;font-weight:bold;">Pending</span>']
      ])}
      <p style="margin-top:20px;"><strong>Note:</strong> Withdrawal processing may take up to 24 hours.</p>
    `)
  },

  {
    name: 'Deposit Confirmation',
    slug: 'deposit-confirmation',
    subject: 'Deposit Approved - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a deposit is confirmed/approved.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'amount', description: 'Deposit amount', example: '$500' },
      { key: 'method', description: 'Payment method', example: 'Bank Transfer' },
      { key: 'txn_id', description: 'Transaction ID', example: 'TXN123456' }
    ],
    htmlContent: hcfShell('Deposit Approved ✔', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Great news! Your deposit has been approved and the funds have been credited to your trading account.</p>
      <p><strong>Deposit Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Amount', '{{amount}}'],
        ['Payment Method', '{{method}}'],
        ['Transaction ID', '{{txn_id}}'],
        ['Status', '<span style="color:#16a34a;font-weight:bold;">Approved</span>']
      ])}
    `)
  },

  {
    name: 'Withdrawal Confirmation',
    slug: 'withdrawal-confirmation',
    subject: 'Withdrawal Approved - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a withdrawal is confirmed/approved.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'amount', description: 'Withdrawal amount', example: '$500' },
      { key: 'method', description: 'Payment method', example: 'Bank Transfer' },
      { key: 'txn_id', description: 'Transaction ID', example: 'TXN123456' }
    ],
    htmlContent: hcfShell('Withdrawal Approved ✔', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your withdrawal request has been approved and is being processed for payout.</p>
      <p><strong>Withdrawal Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Amount', '{{amount}}'],
        ['Payment Method', '{{method}}'],
        ['Transaction ID', '{{txn_id}}'],
        ['Status', '<span style="color:#16a34a;font-weight:bold;">Approved</span>']
      ])}
    `)
  },

  // ═══════════════ TRANSACTION STATUS (generic — used by emailService) ═══════════════

  {
    name: 'Transaction Status Update',
    slug: 'transaction-status',
    subject: '{{heading}} - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Generic transaction status email covering deposit/withdrawal lifecycle updates.',
    placeholders: [
      { key: 'heading', description: 'Email heading e.g. Deposit Approved', example: 'Deposit Approved' },
      { key: 'message', description: 'Intro message', example: 'Your deposit has been approved.' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'transaction_type', description: 'Type: Deposit/Withdrawal', example: 'Deposit' },
      { key: 'amount', description: 'Amount', example: '$500' },
      { key: 'status', description: 'Status label', example: 'Approved' },
      { key: 'processed_at', description: 'Processed date/time', example: '2026-04-09 10:30 AM' },
      { key: 'user_name', description: 'User first name', example: 'John' }
    ],
    htmlContent: hcfShell('{{heading}}', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>{{message}}</p>
      <p><strong>Transaction Details:</strong></p>
      ${detailTable([
        ['Transaction ID', '{{transaction_id}}'],
        ['Type', '{{transaction_type}}'],
        ['Amount', '{{amount}}'],
        ['Status', '{{status}}'],
        ['Processed At', '{{processed_at}}']
      ])}
    `)
  },

  // ═══════════════ KYC TEMPLATES ═══════════════

  {
    name: 'KYC Verification Request',
    slug: 'kyc-verification-request',
    subject: 'KYC Verification Request Received - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a KYC verification request is received from a user.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'document_type', description: 'Document type submitted', example: 'Passport' }
    ],
    htmlContent: hcfShell('KYC Verification Request Received', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your KYC verification request has been received and is currently under review by our compliance team.</p>
      <p><strong>Submission Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Document Type', '{{document_type}}'],
        ['Status', '<span style="color:#e67e22;font-weight:bold;">Under Review</span>']
      ])}
      <p>You will be notified once the review is complete. This usually takes 1-2 business days.</p>
    `)
  },

  {
    name: 'KYC Verification Confirmation',
    slug: 'kyc-verification-confirmation',
    subject: 'KYC Verified Successfully - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when KYC is approved.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' }
    ],
    htmlContent: hcfShell('KYC Verified Successfully ✔', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Congratulations! Your KYC verification has been approved. You now have full access to all trading features.</p>
      <p><strong>Verification Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Status', '<span style="color:#16a34a;font-weight:bold;">Verified</span>']
      ])}
    `)
  },

  {
    name: 'KYC Status Update',
    slug: 'kyc-status',
    subject: 'KYC {{status}} - HC Finvest',
    category: 'notification',
    isSystem: false,
    description: 'Generic KYC status notification email used by emailService.',
    placeholders: [
      { key: 'status', description: 'KYC status — APPROVED / REJECTED / PENDING', example: 'APPROVED' },
      { key: 'reason', description: 'Reason or note', example: 'Verification completed successfully' },
      { key: 'user_name', description: 'User first name', example: 'John' }
    ],
    htmlContent: hcfShell('KYC {{status}}', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your KYC verification status has been updated.</p>
      <p><strong>Details:</strong></p>
      ${detailTable([
        ['Status', '{{status}}'],
        ['Reason', '{{reason}}']
      ])}
    `)
  },

  // ═══════════════ BANK / WITHDRAWAL METHOD STATUS ═══════════════

  {
    name: 'Bank/UPI Status Update',
    slug: 'bank-status',
    subject: 'Withdrawal Method {{status}} - HC Finvest',
    category: 'notification',
    isSystem: false,
    description: 'Notification when a bank account or UPI method is approved/rejected.',
    placeholders: [
      { key: 'status', description: 'APPROVED / REJECTED', example: 'APPROVED' },
      { key: 'method_type', description: 'Bank Transfer / UPI', example: 'Bank Transfer' },
      { key: 'account_label', description: 'Account identifier', example: 'HDFC • 4321' },
      { key: 'reason', description: 'Reason or note', example: 'Verification completed' },
      { key: 'user_name', description: 'User first name', example: 'John' }
    ],
    htmlContent: hcfShell('Withdrawal Method {{status}}', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your withdrawal method has been reviewed.</p>
      <p><strong>Details:</strong></p>
      ${detailTable([
        ['Method Type', '{{method_type}}'],
        ['Account', '{{account_label}}'],
        ['Status', '{{status}}'],
        ['Reason', '{{reason}}']
      ])}
    `)
  },

  // ═══════════════ SUPPORT TICKET ═══════════════

  {
    name: 'Support Ticket Update',
    slug: 'support-ticket',
    subject: 'Support Ticket {{update_type}} - HC Finvest',
    category: 'notification',
    isSystem: false,
    description: 'Notification when a support ticket is created, replied to, or status-changed.',
    placeholders: [
      { key: 'update_type', description: 'CREATED / REPLIED / STATUS', example: 'CREATED' },
      { key: 'ticket_id', description: 'Ticket ID', example: 'TKT-00123' },
      { key: 'ticket_subject', description: 'Ticket subject', example: 'Withdrawal issue' },
      { key: 'ticket_category', description: 'Ticket category', example: 'WITHDRAWAL' },
      { key: 'ticket_status', description: 'Current status', example: 'OPEN' },
      { key: 'message', description: 'Update message', example: 'There is an update on your ticket.' },
      { key: 'user_name', description: 'User first name', example: 'John' }
    ],
    htmlContent: hcfShell('Support Ticket {{update_type}}', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>{{message}}</p>
      <p><strong>Ticket Details:</strong></p>
      ${detailTable([
        ['Ticket ID', '{{ticket_id}}'],
        ['Subject', '{{ticket_subject}}'],
        ['Category', '{{ticket_category}}'],
        ['Status', '{{ticket_status}}']
      ])}
    `)
  },

  // ═══════════════ IB (INTRODUCING BROKER) STATUS ═══════════════

  {
    name: 'IB Status Update',
    slug: 'ib-status',
    subject: 'IB Status {{status}} - HC Finvest',
    category: 'notification',
    isSystem: false,
    description: 'Notification when IB application status changes.',
    placeholders: [
      { key: 'status', description: 'PENDING / ACTIVE / REJECTED / BLOCKED', example: 'ACTIVE' },
      { key: 'intro', description: 'Intro paragraph', example: 'Your IB application has been approved.' },
      { key: 'plan_name', description: 'Assigned IB plan', example: 'Gold Partner' },
      { key: 'reason', description: 'Reason or note', example: 'Your IB dashboard is now available.' },
      { key: 'user_name', description: 'User first name', example: 'John' }
    ],
    htmlContent: hcfShell('IB Status {{status}}', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>{{intro}}</p>
      <p><strong>IB Details:</strong></p>
      ${detailTable([
        ['Status', '{{status}}'],
        ['Assigned Plan', '{{plan_name}}'],
        ['Reason / Note', '{{reason}}']
      ])}
    `)
  },

  // ═══════════════ COMPETITION TEMPLATES ═══════════════

  {
    name: 'Competition Joined Notification',
    slug: 'competition-joined',
    subject: "You've Joined a Competition - HC Finvest",
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a user joins a competition (legacy slug).',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'competition_name', description: 'Competition name', example: 'Weekly Trading Challenge' },
      { key: 'start_date', description: 'Competition start date', example: '2026-04-15' },
      { key: 'end_date', description: 'Competition end date', example: '2026-04-30' }
    ],
    htmlContent: hcfShell("You've Joined a Competition! 🏆", `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Congratulations! You have successfully joined a trading competition.</p>
      <p><strong>Competition Details:</strong></p>
      ${detailTable([
        ['Full Name', '{{user_name}}'],
        ['Email', '{{email}}'],
        ['Competition', '{{competition_name}}'],
        ['Start Date', '{{start_date}}'],
        ['End Date', '{{end_date}}'],
        ['Status', '<span style="color:#16a34a;font-weight:bold;">Joined</span>']
      ])}
      <p>Good luck and trade wisely!</p>
    `)
  },

  {
    name: 'Competition Join (Service)',
    slug: 'competition-join',
    subject: 'Competition Joined Successfully - HC Finvest',
    category: 'notification',
    isSystem: false,
    description: 'Competition join confirmation used by emailService helper.',
    placeholders: [
      { key: 'competition_name', description: 'Competition name', example: 'Weekly Trading Challenge' },
      { key: 'start_date', description: 'Start date', example: '2026-04-15 09:00 AM' },
      { key: 'user_name', description: 'User first name', example: 'John' }
    ],
    htmlContent: hcfShell('Competition Registration Confirmed ✔', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your spot has been confirmed successfully. Get ready to compete!</p>
      <p><strong>Competition Details:</strong></p>
      ${detailTable([
        ['Competition', '{{competition_name}}'],
        ['Start Date', '{{start_date}}'],
        ['Status', '<span style="color:#16a34a;font-weight:bold;">Joined</span>']
      ])}
      <p>Good luck and trade wisely!</p>
    `)
  },

  // ═══════════════ CRYPTO TRANSACTION ═══════════════

  {
    name: 'Crypto Transaction Update',
    slug: 'crypto-transaction',
    subject: 'Crypto {{status}} - HC Finvest',
    category: 'transactional',
    isSystem: false,
    description: 'Notification for Oxapay/crypto deposit and withdrawal updates.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'transaction_type', description: 'Deposit/Withdrawal', example: 'Deposit' },
      { key: 'amount', description: 'Crypto amount', example: '0.05 BTC' },
      { key: 'currency', description: 'Cryptocurrency', example: 'BTC' },
      { key: 'status', description: 'Status', example: 'Confirmed' },
      { key: 'txn_hash', description: 'Blockchain tx hash', example: '0xabc...def' }
    ],
    htmlContent: hcfShell('Crypto Transaction {{status}}', `
      <p>Hello, <strong>{{user_name}}</strong></p>
      <p>Your crypto {{transaction_type}} has been updated.</p>
      <p><strong>Transaction Details:</strong></p>
      ${detailTable([
        ['Type', '{{transaction_type}}'],
        ['Amount', '{{amount}}'],
        ['Currency', '{{currency}}'],
        ['Status', '{{status}}'],
        ['TX Hash', '{{txn_hash}}']
      ])}
    `)
  }
]


// ──────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION — upsert so it's safe to run multiple times
// ──────────────────────────────────────────────────────────────────────────────

async function seedTemplates() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcf'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    let created = 0, updated = 0

    for (const template of defaultTemplates) {
      const existing = await EmailTemplate.findOne({ slug: template.slug })
      if (existing) {
        await EmailTemplate.updateOne({ slug: template.slug }, template)
        console.log(`  ✏️  Updated: ${template.slug}`)
        updated++
      } else {
        await EmailTemplate.create(template)
        console.log(`  ✅ Created: ${template.slug}`)
        created++
      }
    }

    console.log(`\n✅ Email templates seeded successfully!`)
    console.log(`   ${created} created, ${updated} updated, ${defaultTemplates.length} total`)
    await mongoose.disconnect()
    process.exit(0)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedTemplates()
