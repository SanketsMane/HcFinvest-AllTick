import express from 'express'
import EmailOTP from '../models/EmailOTP.js'
import EmailTemplate from '../models/EmailTemplate.js'
import EmailLog from '../models/EmailLog.js'
import User from '../models/User.js'
import emailService from '../services/emailService.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

const isValidEmailAddress = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const requireEmailAccess = (req, res, permissionKeys = []) => {
  //Sanket v2.0 - enforce granular admin permissions before exposing sensitive email operations
  const admin = req.admin
  if (!admin) {
    res.status(403).json({ success: false, message: 'Admin access required' })
    return false
  }
  if (admin.role === 'SUPER_ADMIN') return true

  const keys = Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys]
  const hasPermission = keys.length === 0 || keys.some((key) => !!admin.permissions?.[key])

  if (!hasPermission) {
    res.status(403).json({ success: false, message: 'Insufficient permission for email operations' })
    return false
  }

  return true
}

// Rate limiting middleware for OTP requests
const otpRateLimiter = async (req, res, next) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' })
  }

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
  const recentRequests = await EmailOTP.countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gte: oneMinuteAgo }
  })

  if (recentRequests >= 2) {
    return res.status(429).json({ 
      success: false, 
      message: 'Too many requests. Please wait a minute before requesting another OTP.' 
    })
  }

  next()
}

// ==================== PUBLIC ROUTES ====================

// Send OTP for signup
router.post('/send-otp', otpRateLimiter, async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    // Check if user already exists (for signup)
    if (purpose === 'signup') {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'An account with this email already exists' 
        })
      }
    }

    // Generate OTP
    const { otp } = await EmailOTP.createOTP(email, purpose, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Send OTP email
    await emailService.sendOTPEmail(email, otp, purpose)

    res.json({ 
      success: true, 
      message: 'OTP sent successfully. Please check your email.',
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'signup' } = req.body

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      })
    }

    await EmailOTP.verifyOTP(email, otp, purpose)

    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      verified: true
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Resend OTP
router.post('/resend-otp', otpRateLimiter, async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    // Generate new OTP
    const { otp } = await EmailOTP.createOTP(email, purpose, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Send OTP email
    await emailService.sendOTPEmail(email, otp, purpose)

    res.json({ 
      success: true, 
      message: 'OTP resent successfully',
      expiresIn: 600
    })

  } catch (error) {
    console.error('Resend OTP error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// ==================== ADMIN ROUTES ====================

// Get all email templates
router.get('/templates', adminMiddleware, async (req, res) => {
  try {
    const { category, isActive } = req.query
    const filter = {}
    
    if (category) filter.category = category
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const templates = await EmailTemplate.find(filter)
      .sort({ category: 1, name: 1 })

    res.json({ success: true, templates })

  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single template
router.get('/templates/:id', adminMiddleware, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    res.json({ success: true, template })

  } catch (error) {
    console.error('Get template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create email template
router.post('/templates', adminMiddleware, async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, textContent, description, category, placeholders } = req.body

    if (!name || !slug || !subject || !htmlContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, slug, subject, and HTML content are required' 
      })
    }

    const template = await EmailTemplate.create({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      subject,
      htmlContent,
      textContent,
      description,
      category,
      placeholders,
      createdBy: req.admin?._id
    })

    res.status(201).json({ success: true, template })

  } catch (error) {
    console.error('Create template error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'A template with this name or slug already exists' 
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update email template
router.put('/templates/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, textContent, description, category, placeholders, isActive } = req.body

    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    // Don't allow editing system templates' slug
    if (template.isSystem && slug && slug !== template.slug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change slug of system templates' 
      })
    }

    Object.assign(template, {
      name: name || template.name,
      slug: slug ? slug.toLowerCase().replace(/\s+/g, '-') : template.slug,
      subject: subject || template.subject,
      htmlContent: htmlContent || template.htmlContent,
      textContent: textContent !== undefined ? textContent : template.textContent,
      description: description !== undefined ? description : template.description,
      category: category || template.category,
      placeholders: placeholders || template.placeholders,
      isActive: isActive !== undefined ? isActive : template.isActive,
      updatedBy: req.admin?._id
    })

    await template.save()

    res.json({ success: true, template })

  } catch (error) {
    console.error('Update template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete email template
router.delete('/templates/:id', adminMiddleware, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    if (template.isSystem) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete system templates' 
      })
    }

    await template.deleteOne()

    res.json({ success: true, message: 'Template deleted successfully' })

  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Preview template with sample data
router.post('/templates/:id/preview', adminMiddleware, async (req, res) => {
  try {
    const { data = {} } = req.body
    const template = await EmailTemplate.findById(req.params.id)
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    // Add default preview data
    const previewData = {
      app_name: process.env.APP_NAME || 'HCF Invest',
      user_name: 'John Doe',
      email: 'john@example.com',
      otp: '123456',
      year: new Date().getFullYear(),
      ...data
    }

    const rendered = template.render(previewData)

    res.json({ success: true, preview: rendered })

  } catch (error) {
    console.error('Preview template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send email to user (manual trigger)
router.post('/send', adminMiddleware, async (req, res) => {
  try {
    if (!requireEmailAccess(req, res, ['canManageUsers', 'canViewReports'])) return

    const { 
      userId, 
      email, 
      templateId, 
      templateSlug,
      subject,
      htmlContent,
      data = {} 
    } = req.body

    let recipientEmail = email
    let recipientName = data.user_name
    let recipientUserId = userId

    // If userId provided, get user details
    if (userId) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }
      recipientEmail = user.email
      recipientName = user.firstName
      recipientUserId = user._id
    }

    if (!recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or userId is required' 
      })
    }

    if (!isValidEmailAddress(recipientEmail)) {
      return res.status(400).json({ success: false, message: 'A valid recipient email is required' })
    }

    let result

    // If template provided, use template
    if (templateId || templateSlug) {
      const resolvedTemplate = templateSlug
        ? await EmailTemplate.getBySlug(templateSlug)
        : await EmailTemplate.findById(templateId)

      if (!resolvedTemplate) {
        return res.status(404).json({ success: false, message: 'Email template not found or inactive' })
      }

      result = await emailService.sendTemplateEmail({
        to: recipientEmail,
        toName: recipientName,
        userId: recipientUserId,
        templateSlug: resolvedTemplate.slug,
        data,
        category: 'manual',
        sentBy: req.admin?._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
    } else if (subject && htmlContent) {
      const safeSubject = String(subject || '').trim()
      const safeHtmlContent = String(htmlContent || '').trim()

      if (!safeSubject || !safeHtmlContent) {
        return res.status(400).json({ success: false, message: 'Subject and HTML content are required' })
      }

      if (safeSubject.length > 200) {
        return res.status(400).json({ success: false, message: 'Subject must be 200 characters or fewer' })
      }

      if (safeHtmlContent.length > 200000) {
        return res.status(400).json({ success: false, message: 'HTML content is too large' })
      }

      // Custom email
      result = await emailService.sendEmail({
        to: recipientEmail,
        toName: recipientName,
        userId: recipientUserId,
        subject: safeSubject,
        html: safeHtmlContent,
        category: 'manual',
        sentBy: req.admin?._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Either templateId/templateSlug or subject/htmlContent is required' 
      })
    }

    res.json({ success: true, message: 'Email sent successfully', ...result })

  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get email logs
router.get('/logs', adminMiddleware, async (req, res) => {
  try {
    if (!requireEmailAccess(req, res, ['canViewReports', 'canManageUsers'])) return

    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      email,
      userId,
      startDate,
      endDate 
    } = req.query

    const parsedPage = Math.max(parseInt(page) || 1, 1)
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100)

    const filter = {}
    
    //Sanket v2.0 - build server-side filters so email logs stay paginated and production-friendly even at higher volume
    if (status) filter.status = status
    if (category) filter.category = category
    if (email) filter['recipient.email'] = new RegExp(escapeRegex(email), 'i')
    if (userId) filter['recipient.userId'] = userId
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const skip = (parsedPage - 1) * parsedLimit

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('template', 'name slug')
        .populate('sentBy', 'email firstName lastName'),
      EmailLog.countDocuments(filter)
    ])

    res.json({
      success: true,
      logs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    })

  } catch (error) {
    console.error('Get email logs error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single email log details
router.get('/logs/:id', adminMiddleware, async (req, res) => {
  try {
    if (!requireEmailAccess(req, res, ['canViewReports', 'canManageUsers'])) return

    const log = await EmailLog.findById(req.params.id)
      .populate('template', 'name slug')
      .populate('sentBy', 'email firstName lastName')

    if (!log) {
      return res.status(404).json({ success: false, message: 'Email log not found' })
    }

    res.json({ success: true, log })
  } catch (error) {
    console.error('Get email log details error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Resend an email from an existing failed/previous log record
router.post('/logs/:id/resend', adminMiddleware, async (req, res) => {
  try {
    if (!requireEmailAccess(req, res, ['canManageUsers', 'canViewReports'])) return

    const result = await emailService.retryEmailById(req.params.id, {
      source: 'admin-resend',
      adminId: req.admin?._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    if (result.status === 'skipped') {
      return res.status(400).json({
        success: false,
        message: result.reason || 'This email log is not eligible for retry',
        ...result
      })
    }

    res.json({ success: true, message: 'Email resent successfully', ...result })
  } catch (error) {
    console.error('Resend email log error:', error)
    res.status(error.message === 'Email log not found' ? 404 : 500).json({ success: false, message: error.message })
  }
})

// Retry a batch of failed email logs
router.post('/retry-failed', adminMiddleware, async (req, res) => {
  try {
    if (!requireEmailAccess(req, res, ['canManageUsers', 'canViewReports'])) return

    const { limit = 10, includePending = false } = req.body || {}
    const result = await emailService.retryFailedEmails({
      limit,
      includePending,
      source: 'admin-batch',
      adminId: req.admin?._id
    })

    res.json({
      success: true,
      message: `Retry queue processed ${result.processed || 0} email log(s)`,
      ...result
    })
  } catch (error) {
    console.error('Batch retry email logs error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get email stats
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    if (!requireEmailAccess(req, res, ['canViewReports', 'canManageUsers'])) return

    const { startDate, endDate } = req.query

    const stats = await EmailLog.getStats(startDate, endDate)

    // Format stats
    const formattedStats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      delivered: 0,
      opened: 0
    }

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count
      formattedStats.total += stat.count
    })

    res.json({ success: true, stats: formattedStats })

  } catch (error) {
    console.error('Get email stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Verify email provider connection (admin-only to avoid leaking infrastructure details)
router.get('/verify-connection', adminMiddleware, async (req, res) => {
  try {
    const connectionStatus = await emailService.verifyConnection()
    
    if (connectionStatus.success) {
      res.json({ 
        success: true, 
        message: connectionStatus.message,
        provider: process.env.EMAIL_PROVIDER || 'resend'
      })
    } else {
      res.status(500).json({ 
        success: false, 
        message: connectionStatus.message,
        troubleshooting: [
          'Verify the configured email provider credentials',
          'Check if the sender domain/email is verified',
          'Re-test after updating .env secrets on the server'
        ]
      })
    }
  } catch (error) {
    console.error('Verify connection error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message,
      troubleshooting: [
        'Check your .env file configuration',
        'Verify RESEND_API_KEY or SMTP credentials are set correctly'
      ]
    })
  }
})

// Test email configuration
router.post('/test', adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    // Verify connection first
    const connectionStatus = await emailService.verifyConnection()
    if (!connectionStatus.success) {
      return res.status(500).json({ 
        success: false, 
        message: `Email service not configured: ${connectionStatus.message}` 
      })
    }

    // Send test email
    await emailService.sendEmail({
      to: email,
      subject: 'Test Email - HC Finvest',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from HC Finvest.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
      category: 'transactional'
    })

    res.json({ success: true, message: 'Test email sent successfully' })

  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
