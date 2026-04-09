import nodemailer from 'nodemailer'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.initialized = false
    this.retryTimer = null
    this.retryInProgress = false
  }

  _loadConfig() {
    this.provider = process.env.EMAIL_PROVIDER || 'resend'
    this.appName = process.env.APP_NAME || 'HC Finvest'
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'support@heddgecapitals.com'
    this.fromName = process.env.SMTP_FROM_NAME || 'HC Finvest Support'
    this.resendApiKey = process.env.RESEND_API_KEY
    this.retryEnabled = (process.env.EMAIL_RETRY_ENABLED || 'true').toLowerCase() !== 'false'
    this.retryIntervalMs = Math.max(parseInt(process.env.EMAIL_RETRY_INTERVAL_MS || '300000', 10) || 300000, 60000)
    this.retryBatchSize = Math.min(Math.max(parseInt(process.env.EMAIL_RETRY_BATCH_SIZE || '10', 10) || 10, 1), 50)
    this.retryMaxAgeHours = Math.min(Math.max(parseInt(process.env.EMAIL_RETRY_MAX_AGE_HOURS || '24', 10) || 24, 1), 168)
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
    this._startRetryScheduler()
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
    await this.initialize()

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
    await this.initialize()

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
    } catch (err) {
      console.error(`🚨 Fallback in sendOTPEmail for ${email} because:`, err.message)
      return this.sendEmail({
        to: email,
        subject: `Your OTP Code - ${this.appName}`,
        html: this._getOTPEmailHTML(otp, purposeText),
        category: 'otp',
        metadata: { purpose }
      })
    }
  }

  async sendWelcomeEmail(user, password) {
    await this.initialize()

    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'welcome',
        data: { 
          user_name: user.firstName, 
          email: user.email,
          password: password || '********' // Use placeholder if password not provided
        },
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
    await this.initialize()

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

  //Sanket v2.0 - Competition emails now use the same provider + EmailLog pipeline as all core platform emails
  async sendCompetitionJoinEmail({ to, toName, userId, competitionName, startDate }) {
    await this.initialize()

    const formattedStartDate = startDate ? new Date(startDate).toLocaleString() : 'To be announced'

    try {
      return await this.sendTemplateEmail({
        to,
        toName,
        userId,
        templateSlug: 'competition-join',
        data: { competition_name: competitionName || 'Trading Competition', start_date: formattedStartDate, user_name: toName || 'Trader' },
        category: 'notification',
        metadata: { type: 'competition_join', competitionName }
      })
    } catch {
      return this.sendEmail({
        to,
        toName,
        userId,
        subject: `Competition Joined Successfully - ${competitionName || this.appName}`,
        html: this._getStatusEmailHTML({
          title: 'Competition Registration Confirmed',
          intro: `Hi ${toName || 'Trader'}, your spot has been confirmed successfully.`,
          accentColor: '#16a34a',
          rows: [
            ['Competition', competitionName || 'Trading Competition'],
            ['Start Date', formattedStartDate],
            ['Status', 'Joined']
          ]
        }),
        category: 'notification',
        metadata: { type: 'competition_join', competitionName }
      })
    }
  }

  //Sanket v2.0 - Centralized transaction notifications keep deposit/withdraw lifecycle emails consistent and logged
  async sendTransactionStatusEmail({ user, transaction, heading, message, statusLabel }) {
    await this.initialize()
    if (!user?.email || !transaction) return { success: false, skipped: true }

    const type = String(transaction.type || 'Transaction')
    const amount = Number(transaction.amount || 0).toFixed(2)
    const status = statusLabel || transaction.status || 'Updated'
    const introText = message || `Your ${type.toLowerCase()} request has been updated.`
    const headingText = heading || `${type} ${status}`
    const processedAt = transaction.processedAt ? new Date(transaction.processedAt).toLocaleString() : new Date().toLocaleString()
    const txnMeta = {
      type: 'wallet_update',
      transactionId: transaction.transactionId || String(transaction._id || ''),
      transactionType: type,
      status
    }

    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'transaction-status',
        data: {
          heading: headingText,
          message: introText,
          transaction_id: transaction.transactionId || String(transaction._id || 'Pending'),
          transaction_type: type,
          amount: `$${amount}`,
          status,
          processed_at: processedAt,
          user_name: user.firstName || 'Trader'
        },
        category: 'transactional',
        metadata: txnMeta
      })
    } catch {
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `${type} ${status} - ${this.appName}`,
        html: this._getStatusEmailHTML({
          title: headingText,
          intro: introText,
          accentColor: status.toLowerCase().includes('approved') ? '#16a34a' : status.toLowerCase().includes('rejected') ? '#dc2626' : '#f97316',
          rows: [
            ['Transaction ID', transaction.transactionId || String(transaction._id || 'Pending')],
            ['Type', type],
            ['Amount', `$${amount}`],
            ['Status', status],
            ['Processed At', processedAt]
          ]
        }),
        category: 'transactional',
        metadata: txnMeta
      })
    }
  }

  //Sanket v2.0 - KYC status notifications ensure users know whether they can proceed with deposits/withdrawals
  async sendKYCStatusEmail({ user, status, reason = '' }) {
    await this.initialize()
    if (!user?.email) return { success: false, skipped: true }

    const normalizedStatus = String(status || 'updated').toUpperCase()
    const reasonText = reason || (normalizedStatus === 'APPROVED' ? 'Verification completed successfully' : 'Additional review required')

    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'kyc-status',
        data: { status: normalizedStatus, reason: reasonText, user_name: user.firstName || 'Trader' },
        category: 'notification',
        metadata: { type: 'kyc_status', status: normalizedStatus }
      })
    } catch {
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `KYC ${normalizedStatus} - ${this.appName}`,
        html: this._getStatusEmailHTML({
          title: `KYC ${normalizedStatus}`,
          intro: normalizedStatus === 'APPROVED'
            ? 'Your KYC has been approved successfully. You can now access verified account features.'
            : 'Your KYC submission needs attention before it can be approved.',
          accentColor: normalizedStatus === 'APPROVED' ? '#16a34a' : '#dc2626',
          rows: [
            ['Status', normalizedStatus],
            ['Reason', reasonText]
          ]
        }),
        category: 'notification',
        metadata: { type: 'kyc_status', status: normalizedStatus }
      })
    }
  }

  //Sanket v2.0 - Bank/UPI approval emails reduce support tickets around withdrawal setup status
  async sendBankStatusEmail({ user, account, status, reason = '' }) {
    await this.initialize()
    if (!user?.email || !account) return { success: false, skipped: true }

    const normalizedStatus = String(status || account.status || 'updated').toUpperCase()
    const accountLabel = account.type === 'UPI'
      ? (account.upiId || 'UPI method')
      : `${account.bankName || 'Bank'} • ${String(account.accountNumber || '').slice(-4) || 'XXXX'}`
    const reasonText = reason || (normalizedStatus === 'APPROVED' ? 'Verification completed successfully' : 'Please review and re-submit if needed')

    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'bank-status',
        data: { status: normalizedStatus, method_type: account.type || 'Bank Transfer', account_label: accountLabel, reason: reasonText, user_name: user.firstName || 'Trader' },
        category: 'notification',
        metadata: { type: 'bank_status', status: normalizedStatus }
      })
    } catch {
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `Withdrawal Method ${normalizedStatus} - ${this.appName}`,
        html: this._getStatusEmailHTML({
          title: `Withdrawal Method ${normalizedStatus}`,
          intro: normalizedStatus === 'APPROVED'
            ? 'Your withdrawal method is now verified and ready to use.'
            : 'Your submitted withdrawal method was not approved in its current form.',
          accentColor: normalizedStatus === 'APPROVED' ? '#16a34a' : '#dc2626',
          rows: [
            ['Method Type', account.type || 'Bank Transfer'],
            ['Account', accountLabel],
            ['Status', normalizedStatus],
            ['Reason', reasonText]
          ]
        }),
        category: 'notification',
        metadata: { type: 'bank_status', status: normalizedStatus }
      })
    }
  }

  //Sanket v2.0 - Support ticket emails keep traders informed whenever their ticket is created, updated, or resolved
  async sendSupportTicketEmail({ user, ticket, updateType = 'created', message = '' }) {
    await this.initialize()
    if (!user?.email || !ticket) return { success: false, skipped: true }

    const normalizedUpdate = String(updateType || 'updated').toUpperCase()
    const introText = message || 'There is an update on your support request.'

    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'support-ticket',
        data: {
          update_type: normalizedUpdate,
          ticket_id: ticket.ticketId || String(ticket._id || ''),
          ticket_subject: ticket.subject || 'Support Request',
          ticket_category: ticket.category || 'GENERAL',
          ticket_status: ticket.status || 'OPEN',
          message: introText,
          user_name: user.firstName || 'Trader'
        },
        category: 'notification',
        metadata: { type: 'support_ticket', ticketId: ticket.ticketId, updateType: normalizedUpdate }
      })
    } catch {
      const subjectMap = {
        CREATED: `Support Ticket Created - ${ticket.ticketId}`,
        REPLIED: `Support Reply - ${ticket.ticketId}`,
        STATUS: `Support Ticket ${ticket.status || 'Updated'} - ${ticket.ticketId}`
      }

      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: subjectMap[normalizedUpdate] || `Support Ticket Update - ${ticket.ticketId}`,
        html: this._getStatusEmailHTML({
          title: `Support Ticket ${normalizedUpdate === 'CREATED' ? 'Created' : 'Updated'}`,
          intro: introText,
          accentColor: normalizedUpdate === 'CREATED' ? '#2563eb' : '#f97316',
          rows: [
            ['Ticket ID', ticket.ticketId || String(ticket._id || '')],
            ['Subject', ticket.subject || 'Support Request'],
            ['Category', ticket.category || 'GENERAL'],
            ['Status', ticket.status || 'OPEN']
          ]
        }),
        category: 'notification',
        metadata: { type: 'support_ticket', ticketId: ticket.ticketId, updateType: normalizedUpdate }
      })
    }
  }

  //Sanket v2.0 - IB lifecycle emails inform applicants when their broker-partner status changes
  async sendIBStatusEmail({ user, status, planName = '', reason = '' }) {
    await this.initialize()
    if (!user?.email) return { success: false, skipped: true }

    const normalizedStatus = String(status || user.ibStatus || 'updated').toUpperCase()
    const introMap = {
      PENDING: 'Your IB application has been received and is now under review.',
      ACTIVE: 'Congratulations — your IB application has been approved and activated.',
      REJECTED: 'Your IB application was reviewed but could not be approved at this time.',
      BLOCKED: 'Your IB access has been restricted. Please contact support for assistance.'
    }
    const introText = introMap[normalizedStatus] || 'Your IB profile has been updated.'
    const reasonText = reason || (normalizedStatus === 'ACTIVE' ? 'Your IB dashboard is now available.' : 'Please contact support if you need more details.')

    try {
      return await this.sendTemplateEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        templateSlug: 'ib-status',
        data: { status: normalizedStatus, intro: introText, plan_name: planName || 'Will be assigned after review', reason: reasonText, user_name: user.firstName || 'Trader' },
        category: 'notification',
        metadata: { type: 'ib_status', status: normalizedStatus }
      })
    } catch {
      return this.sendEmail({
        to: user.email,
        toName: user.firstName,
        userId: user._id,
        subject: `IB Status ${normalizedStatus} - ${this.appName}`,
        html: this._getStatusEmailHTML({
          title: `IB Status ${normalizedStatus}`,
          intro: introText,
          accentColor: normalizedStatus === 'ACTIVE' ? '#16a34a' : normalizedStatus === 'PENDING' ? '#2563eb' : '#dc2626',
          rows: [
            ['Status', normalizedStatus],
            ['Assigned Plan', planName || 'Will be assigned after review'],
            ['Reason / Note', reasonText]
          ]
        }),
        category: 'notification',
        metadata: { type: 'ib_status', status: normalizedStatus }
      })
    }
  }

  _startRetryScheduler() {
    if (!this.retryEnabled || this.retryTimer) return

    //Sanket v2.0 - keep a lightweight background retry loop running so temporary provider/network failures can self-heal
    this.retryTimer = setInterval(() => {
      this.retryFailedEmails({
        limit: this.retryBatchSize,
        includePending: false,
        source: 'scheduler'
      }).catch((error) => {
        console.error('Automatic email retry cycle failed:', error.message)
      })
    }, this.retryIntervalMs)

    if (typeof this.retryTimer?.unref === 'function') {
      this.retryTimer.unref()
    }

    console.log(`♻️ Email retry queue active — every ${Math.round(this.retryIntervalMs / 1000)}s, batch size ${this.retryBatchSize}`)
  }

  async retryEmailById(logId, { source = 'manual', adminId, ipAddress, userAgent } = {}) {
    await this.initialize()

    const log = await EmailLog.findById(logId)
    if (!log) {
      throw new Error('Email log not found')
    }

    return this._retrySingleEmailLog(log, { source, adminId, ipAddress, userAgent })
  }

  async retryFailedEmails({ limit = this.retryBatchSize, includePending = false, source = 'manual-batch', adminId } = {}) {
    await this.initialize()

    if (this.retryInProgress) {
      return {
        success: true,
        skipped: true,
        message: 'Email retry queue is already running',
        processed: 0,
        resent: 0,
        failed: 0,
        skippedCount: 0,
        results: []
      }
    }

    this.retryInProgress = true

    try {
      const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || this.retryBatchSize || 10, 1), 50)
      const maxAgeDate = new Date(Date.now() - (this.retryMaxAgeHours * 60 * 60 * 1000))
      const retryableStatuses = includePending ? ['failed', 'pending'] : ['failed']

      //Sanket v2.0 - retry only unresolved primary logs so automatic recovery does not duplicate already-resolved resend attempts
      const logs = await EmailLog.find({
        status: { $in: retryableStatuses },
        createdAt: { $gte: maxAgeDate },
        'metadata.retryResolved': { $ne: true },
        'metadata.disableAutoRetry': { $ne: true },
        'metadata.isRetryAttempt': { $ne: true },
        $expr: { $lt: ['$retryCount', '$maxRetries'] }
      })
        .sort({ createdAt: 1 })
        .limit(normalizedLimit)

      const results = []
      for (const log of logs) {
        const retryResult = await this._retrySingleEmailLog(log, { source, adminId })
        results.push(retryResult)
      }

      return {
        success: true,
        processed: logs.length,
        resent: results.filter((item) => item.status === 'resent').length,
        failed: results.filter((item) => item.status === 'failed').length,
        skippedCount: results.filter((item) => item.status === 'skipped').length,
        results
      }
    } finally {
      this.retryInProgress = false
    }
  }

  async _retrySingleEmailLog(log, { source = 'manual', adminId, ipAddress, userAgent } = {}) {
    if (!log) {
      return { status: 'skipped', reason: 'Missing email log' }
    }

    if (!log.recipient?.email || !log.subject || (!log.htmlContent && !log.textContent)) {
      await EmailLog.findByIdAndUpdate(log._id, {
        $inc: { retryCount: 1 },
        $set: {
          'metadata.lastRetryAt': new Date(),
          'metadata.lastRetrySource': source,
          'metadata.lastRetryResult': 'skipped',
          'metadata.lastRetryReason': 'Missing recipient or content'
        }
      })

      return {
        status: 'skipped',
        logId: String(log._id),
        reason: 'Missing recipient or content'
      }
    }

    const retryMetadataUpdate = {
      'metadata.lastRetryAt': new Date(),
      'metadata.lastRetrySource': source
    }

    if (adminId) {
      retryMetadataUpdate['metadata.lastRetryRequestedBy'] = String(adminId)
    }

    await EmailLog.findByIdAndUpdate(log._id, {
      $inc: { retryCount: 1 },
      $set: retryMetadataUpdate
    })

    try {
      //Sanket v2.0 - preserve the original payload while tagging the new send as a retry attempt for clean audit history
      const html = log.htmlContent || `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${String(log.textContent || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
      const result = await this.sendEmail({
        to: log.recipient.email,
        toName: log.recipient?.name,
        userId: log.recipient?.userId,
        subject: log.subject,
        html,
        text: log.textContent,
        templateSlug: log.templateSlug,
        templateId: log.template,
        category: log.category || 'transactional',
        metadata: {
          ...(log.metadata || {}),
          originalLogId: String(log.metadata?.originalLogId || log._id),
          retryOfLogId: String(log._id),
          retryAttempt: (log.retryCount || 0) + 1,
          retrySource: source,
          isRetryAttempt: true,
          disableAutoRetry: true
        },
        sentBy: adminId || log.sentBy,
        ipAddress,
        userAgent
      })

      await EmailLog.findByIdAndUpdate(log._id, {
        $set: {
          'metadata.retryResolved': true,
          'metadata.lastRetryResult': 'sent',
          'metadata.lastRetryLogId': String(result.logId || ''),
          'metadata.lastRetryMessageId': result.messageId || ''
        }
      })

      return {
        status: 'resent',
        logId: String(log._id),
        resentLogId: String(result.logId || ''),
        messageId: result.messageId || ''
      }
    } catch (error) {
      await EmailLog.findByIdAndUpdate(log._id, {
        $set: {
          'metadata.lastRetryResult': 'failed',
          'metadata.lastRetryError': error.message
        }
      })

      return {
        status: 'failed',
        logId: String(log._id),
        error: error.message
      }
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

  //Sanket v2.0 - Shared production-style HTML shell for platform alerts and transactional status updates
  _getStatusEmailHTML({ title, intro, rows = [], accentColor = '#f97316' }) {
    const detailRows = rows.map(([label, value]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:600;">${label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;">${value || '-'}</td>
      </tr>
    `).join('')

    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:${accentColor};padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.4px;">${this.appName}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 10px;color:#111827;font-size:22px;">${title}</h2>
          <p style="margin:0 0 22px;color:#4b5563;font-size:14px;line-height:1.7;">${intro}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#f9fafb;">
            ${detailRows}
          </table>
        </td></tr>
        <tr><td style="background:#111827;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  _getOTPEmailHTML(otp, purposeText) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${this.appName}</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Professional Trading Platform</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Your Verification Code</h2>
          <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">Use this code to ${purposeText}:</p>
          <div style="text-align:center;margin:32px 0;">
            <div style="display:inline-block;background:#f97316;border-radius:10px;padding:20px 48px;">
              <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:#fff;font-family:monospace;">${otp}</span>
            </div>
          </div>
          <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">⏱ This code expires in <strong style="color:#f97316;">10 minutes</strong>.</p>
        </td></tr>
        <tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  _getWelcomeEmailHTML(firstName) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${this.appName}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#fff;font-size:24px;">Welcome aboard, ${firstName || 'Trader'}! 🎉</h2>
          <p style="margin:0 0 24px;color:#aaa;font-size:15px;line-height:1.7;">Your account is ready. You're now part of a professional trading community.</p>
        </td></tr>
        <tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  _getPasswordResetEmailHTML(resetUrl) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <tr><td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${this.appName}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Reset your password</h2>
          <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.6;">Click the button below to set a new password.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:700;">Reset Password</a>
          </div>
          <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">This link expires in <strong style="color:#dc2626;">60 minutes</strong>.</p>
        </td></tr>
        <tr><td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
          <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
}

const emailService = new EmailService()
export default emailService
