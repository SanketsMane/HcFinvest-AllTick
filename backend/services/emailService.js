import axios from 'axios'
import nodemailer from 'nodemailer'
import * as postmark from 'postmark'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.initialized = false
  }

  // Load config
  _loadConfig() {
    this.provider = process.env.EMAIL_PROVIDER || 'smtp'
    this.appName = process.env.APP_NAME || 'HC Finvest'
    this.fromEmail = process.env.SMTP_FROM_EMAIL || "support@heddgecapitals.com"
    this.fromName = process.env.SMTP_FROM_NAME || 'HC Finvest Support'
    
    // Resend specific
    this.resendApiKey = process.env.RESEND_API_KEY
    this.resendFrom = process.env.RESEND_FROM_EMAIL || this.fromEmail

    // Postmark specific
    this.postmarkApiKey = process.env.POSTMARK_API_KEY
  }

  async initialize() {
    if (this.initialized) return

    this._loadConfig()

    // SMTP setup
    try {
      if (process.env.SMTP_HOST) {
        const port = parseInt(process.env.SMTP_PORT) || 465
        const isSecure = port === 465

        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtppro.zoho.in',
          port: port,
          secure: isSecure,
          auth: {
            user: process.env.SMTP_USER || "support@heddgecapitals.com",
            pass: process.env.SMTP_PASS || "Jf0DLgxCEptT"
          },
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 30000
        })
      }

      // Postmark setup
      if (this.postmarkApiKey) {
        this.postmarkClient = new postmark.ServerClient(this.postmarkApiKey)
      }

      this.initialized = true
      console.log(`Email service initialized with provider: ${this.provider}`)
    } catch (error) {
      console.error('Failed to initialize email service:', error.message)
      // We don't throw here so sendEmail can still try Resend if SMTP fails
      this.initialized = true 
    }
  }

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
      recipient: {
        email: to,
        name: toName,
        userId
      },
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
      let result;
      if (this.provider === 'postmark' && this.postmarkClient) {
        result = await this._sendViaPostmark(options)
      } else if (this.provider === 'resend' || (!this.transporter && this.resendApiKey)) {
        result = await this._sendViaResend(options)
      } else {
        result = await this._sendViaSMTP(options)
      }

      await EmailLog.updateStatus(emailLog._id, 'sent', {
        providerMessageId: result.messageId
      })

      console.log(`Email sent successfully via ${this.provider} to ${to}`)
      return { success: true, messageId: result.messageId, logId: emailLog._id }
    } catch (error) {
      await EmailLog.updateStatus(emailLog._id, 'failed', {
        error: {
          code: error.code,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      })

      console.error(`Failed to send email to ${to}:`, error.message)
      throw error
    }
  }

  async _sendViaSMTP(options) {
    const { to, toName, subject, html, text } = options
    const senderEmail = this.fromEmail || process.env.SMTP_USER

    const mailOptions = {
      from: `"${this.fromName}" <${senderEmail}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      text: text || this.stripHtml(html)
    }

    const info = await this.transporter.sendMail(mailOptions)
    return { messageId: info.messageId }
  }

  async _sendViaResend(options) {
    const { to, subject, html } = options
    
    if (!this.resendApiKey) {
      throw new Error('Resend API Key is missing')
    }

    const response = await axios.post('https://api.resend.com/emails', {
      from: `"${this.fromName}" <${this.resendFrom}>`,
      to: [to],
      subject: subject,
      html: html
    }, {
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    return { messageId: response.data.id }
  }

  async _sendViaPostmark(options) {
    const { to, subject, html, text } = options
    
    if (!this.postmarkClient) {
      throw new Error('Postmark Client is missing')
    }

    const response = await this.postmarkClient.sendEmail({
      From: `"${this.fromName}" <${this.fromEmail}>`,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text || this.stripHtml(html),
      MessageStream: 'outbound'
    })

    return { messageId: response.MessageID }
  }


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
        data: {
          otp,
          purpose: purposeText,
          expiry_minutes: 10
        },
        category: 'otp'
      })
    } catch (templateError) {
      const html = this.getOTPEmailHTML(otp, purposeText)
      return this.sendEmail({
        to: email,
        subject: `Your OTP Code - ${this.appName}`,
        html,
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
        data: {
          user_name: user.firstName,
          email: user.email,
          password: user.password // Only include if you have a temporary password to share
        },
        category: 'transactional'
      })
    } catch (templateError) {
      const html = this.getWelcomeEmailHTML(user.firstName)
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `Welcome to ${this.appName}!`,
        html,
        category: 'transactional'
      })
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    try {
      return await this.sendTemplateEmail({
        to: email,
        templateSlug: 'password-reset',
        data: {
          reset_url: resetUrl,
          reset_token: resetToken,
          expiry_minutes: 60
        },
        category: 'transactional'
      })
    } catch (templateError) {
      const html = this.getPasswordResetEmailHTML(resetUrl)
      return this.sendEmail({
        to: email,
        subject: `Password Reset - ${this.appName}`,
        html,
        category: 'transactional'
      })
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  getOTPEmailHTML(otp, purposeText) {
  return `
  <div style="font-family: Arial; padding: 20px;">
    <h2>Your OTP Code</h2>
    <p>Use this code to ${purposeText}</p>
    <h1 style="color:#f97316; letter-spacing: 5px;">${otp}</h1>
    <p>This code is valid for 10 minutes.</p>
  </div>
  `
}

  async verifyConnection() {
    await this.initialize()
    
    if (this.provider === 'postmark' && this.postmarkClient) {
      try {
        await this.postmarkClient.getServer()
        return { success: true, message: 'Postmark service is ready' }
      } catch (error) {
        return { success: false, message: `Postmark error: ${error.message}` }
      }
    }

    if (this.transporter) {
      try {
        await this.transporter.verify()
        return { success: true, message: 'Email service is ready' }
      } catch (error) {
        return { success: false, message: error.message }
      }
    }

    return { success: false, message: 'No active email provider configured' }
  }
}

const emailService = new EmailService()
export default emailService;

