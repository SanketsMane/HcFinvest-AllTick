import nodemailer from 'nodemailer'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.initialized = false
  }

  _loadConfig() {
    this.provider = process.env.EMAIL_PROVIDER || 'resend'
    this.appName = process.env.APP_NAME || 'HC Finvest'
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'support@heddgecapitals.com'
    this.fromName = process.env.SMTP_FROM_NAME || 'HC Finvest Support'
    this.resendApiKey = process.env.RESEND_API_KEY
  }

  async initialize() {
    if (this.initialized) return
    this._loadConfig()

    // SMTP fallback setup
    if (process.env.SMTP_HOST) {
      try {
        const port = parseInt(process.env.SMTP_PORT) || 465
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: port === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 30000
        })
      } catch (error) {
        console.error('SMTP transporter setup failed:', error.message)
      }
    }

    this.initialized = true
    console.log(`✅ Email service initialized — provider: ${this.provider}`)
  }

  // ─── Core send ────────────────────────────────────────────────────────────

  async sendEmail(options) {
    await this.initialize()

    const {
      to,
      toName,
      userId,
      subject,
      html,
      text,
      templateSlug,
      templateId,
      category = 'transactional',
      metadata = {},
      sentBy,
      ipAddress,
      userAgent
    } = options

    const emailLog = await EmailLog.create({
      recipient: { email: to, name: toName, userId },
      template: templateId,
      templateSlug,
      subject,
      htmlContent: html,
      textContent: text,
      status: 'pending',
      provider: this.provider,
      category,
      metadata,
      sentBy,
      ipAddress,
      userAgent
    })

    try {
      let result

      if (this.provider === 'resend' && this.resendApiKey) {
        result = await this._sendViaResend(options)
      } else if (this.transporter) {
        result = await this._sendViaSMTP(options)
      } else {
        throw new Error('No email provider configured. Set RESEND_API_KEY or SMTP_HOST in .env')
      }

      await EmailLog.updateStatus(emailLog._id, 'sent', {
        providerMessageId: result.messageId
      })

      console.log(`📧 Email sent via ${this.provider} → ${to}`)
      return { success: true, messageId: result.messageId, logId: emailLog._id }

    } catch (error) {
      await EmailLog.updateStatus(emailLog._id, 'failed', {
        error: {
          code: error.code,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      })

      console.error(`❌ Failed to send email to ${to}:`, error.message)
      throw error
    }
  }

  // ─── Providers ────────────────────────────────────────────────────────────

  async _sendViaResend(options) {
    const { to, toName, subject, html, text } = options

    if (!this.resendApiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables')
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: toName ? [`${toName} <${to}>`] : [to],
        subject,
        html,
        text: text || this._stripHtml(html)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.message || data?.name || `Resend error ${response.status}`
      throw new Error(msg)
    }

    return { messageId: data.id }
  }

  async _sendViaSMTP(options) {
    const { to, toName, subject, html, text } = options

    if (!this.transporter) {
      throw new Error('SMTP transporter is not initialized')
    }

    const info = await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      text: text || this._stripHtml(html)
    })

    return { messageId: info.messageId }
  }

  // ─── High-level helpers ───────────────────────────────────────────────────

  async sendTemplateEmail(options) {
    const {
      to,
      toName,
      userId,
      templateSlug,
      data = {},
      category,
      metadata = {},
      sentBy,
      ipAddress,
      userAgent
    } = options

    const template = await EmailTemplate.getBySlug(templateSlug)
    if (!template) {
      throw new Error(`Email template not found: ${templateSlug}`)
    }

    const templateData = {
      app_name: this.appName,
      user_name: toName || 'User',
      email: to,
      year: new Date().getFullYear(),
      ...data
    }

    const { subject, html, text } = template.render(templateData)

    return this.sendEmail({
      to,
      toName,
      userId,
      subject,
      html,
      text,
      templateSlug,
      templateId: template._id,
      category: category || template.category,
      metadata,
      sentBy,
      ipAddress,
      userAgent
    })
  }

  async sendOTPEmail(email, otp, purpose = 'signup') {
    const purposeTexts = {
      signup: 'complete your registration',
      login: 'log in to your account',
      password_reset: 'reset your password',
      email_change: 'verify your new email address',
      verification: 'verify your email address'
    }

    const purposeText = purposeTexts[purpose] || 'verify your identity'

    try {
      return await this.sendTemplateEmail({
        to: email,
        templateSlug: `otp-${purpose}`,
        data: { otp, purpose: purposeText, expiry_minutes: 10 },
        category: 'otp'
      })
    } catch {
      return this.sendEmail({
        to: email,
        subject: `Your OTP Code - ${this.appName}`,
        html: this._getOTPEmailHTML(otp, purposeText),
        category: 'otp',
        metadata: { purpose }
      })
    }
  }

  async sendWelcomeEmail(user) {
    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'welcome',
        data: { user_name: user.firstName, email: user.email },
        category: 'transactional'
      })
    } catch {
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `Welcome to ${this.appName}!`,
        html: this._getWelcomeEmailHTML(user.firstName),
        category: 'transactional'
      })
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    try {
      return await this.sendTemplateEmail({
        to: email,
        templateSlug: 'password-reset',
        data: { reset_url: resetUrl, reset_token: resetToken, expiry_minutes: 60 },
        category: 'transactional'
      })
    } catch {
      return this.sendEmail({
        to: email,
        subject: `Password Reset - ${this.appName}`,
        html: this._getPasswordResetEmailHTML(resetUrl),
        category: 'transactional'
      })
    }
  }

  // ─── Connection check ─────────────────────────────────────────────────────

  async verifyConnection() {
    await this.initialize()

    if (this.provider === 'resend' && this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/domains', {
          headers: { 'Authorization': `Bearer ${this.resendApiKey}` }
        })
        if (response.ok) {
          return { success: true, message: 'Resend API is reachable and key is valid' }
        }
        return { success: false, message: `Resend returned status ${response.status}` }
      } catch (error) {
        return { success: false, message: `Resend check failed: ${error.message}` }
      }
    }

    if (this.transporter) {
      try {
        await this.transporter.verify()
        return { success: true, message: 'SMTP connection verified' }
      } catch (error) {
        return { success: false, message: `SMTP error: ${error.message}` }
      }
    }

    return { success: false, message: 'No active email provider configured' }
  }

  // ─── Fallback HTML templates ───────────────────────────────────────────────

  _stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  _getOTPEmailHTML(otp, purposeText) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #1a1a1a;">Your Verification Code</h2>
      <p style="color: #555;">Use this code to ${purposeText}:</p>
      <div style="background: #fff; border: 2px dashed #f97316; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #f97316;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">— ${this.appName} Team</p>
    </div>`
  }

  _getWelcomeEmailHTML(firstName) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #1a1a1a;">Welcome to ${this.appName}, ${firstName || 'Trader'}! 🎉</h2>
      <p style="color: #555;">Your account is ready. Start exploring the platform and take your trading to the next level.</p>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">— ${this.appName} Team</p>
    </div>`
  }

  _getPasswordResetEmailHTML(resetUrl) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #1a1a1a;">Password Reset Request</h2>
      <p style="color: #555;">Click the button below to reset your password. This link expires in <strong>60 minutes</strong>.</p>
      <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 28px; background: #f97316; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      <p style="color: #888; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">— ${this.appName} Team</p>
    </div>`
  }
}

const emailService = new EmailService()
export default emailService
