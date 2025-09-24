const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get email configuration
router.get('/config', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Get email configuration
    let emailConfig = await db.collection('emailConfig').findOne({ type: 'default' });
    
    if (!emailConfig) {
      // Create default email configuration
      const defaultConfig = {
        type: 'default',
        recipients: {
          telecom: {
            name: 'Telecom Department',
            email: 'telecom@fraud.gov.in',
            department: 'Telecom Regulatory Authority',
            priority: 'high',
            active: true
          },
          bank: {
            name: 'Banking Authority',
            email: 'banking@fraud.gov.in',
            department: 'Reserve Bank of India',
            priority: 'high',
            active: true
          },
          nodal: {
            name: 'Nodal Officer',
            email: 'nodal@fraud.gov.in',
            department: 'Cyber Crime Division',
            priority: 'critical',
            active: true
          }
        },
        templates: {
          telecom: {
            subject: 'URGENT: Fraud Complaint - Telecom Department - Case ID: {caseId}',
            body: `Dear Telecom Department,

We are writing to report a fraudulent activity involving the following phone number that requires immediate attention:

SCAMMER DETAILS:
- Phone Number: {scammerPhone}
- Name: {scammerName}
- Address: {scammerAddress}
- Email: {scammerEmail}

CASE DETAILS:
- Case ID: {caseId}
- Victim: {victimName}
- Victim Phone: {victimPhone}
- Victim Email: {victimEmail}
- Amount Lost: ₹{amount}
- Incident Date: {incidentDate}
- Description: {description}

EVIDENCE:
- Evidence Type: {evidenceTypes}
- Total Evidence Files: {evidenceCount}

LEGAL NOTICE:
This complaint is filed under Section 91 of the Code of Criminal Procedure (CrPC) and requires immediate investigation.

Please take necessary action against this fraudulent number and provide us with updates on the investigation within 48 hours.

This is an automated message from the 91 CrPC Fraud Reporting System.

Best regards,
Fraud Investigation Team
Cyber Crime Division`
          },
          bank: {
            subject: 'URGENT: Banking Fraud Complaint - Case ID: {caseId}',
            body: `Dear Bank Authority,

We are reporting a fraudulent banking activity involving the following account details that requires immediate investigation:

SCAMMER BANK DETAILS:
- Bank Account: {scammerBankAccount}
- IFSC Code: {scammerIfscCode}
- UPI ID: {scammerUpiId}
- Name: {scammerName}
- Phone: {scammerPhone}
- Email: {scammerEmail}

CASE DETAILS:
- Case ID: {caseId}
- Victim: {victimName}
- Victim Phone: {victimPhone}
- Victim Email: {victimEmail}
- Amount Lost: ₹{amount}
- Incident Date: {incidentDate}
- Description: {description}

EVIDENCE:
- Evidence Type: {evidenceTypes}
- Total Evidence Files: {evidenceCount}

LEGAL NOTICE:
This complaint is filed under Section 91 of the Code of Criminal Procedure (CrPC) and banking regulations.

Please investigate this account immediately and take appropriate action under banking regulations.

This is an automated message from the 91 CrPC Fraud Reporting System.

Best regards,
Fraud Investigation Team
Cyber Crime Division`
          },
          nodal: {
            subject: 'URGENT: Comprehensive Fraud Case - Nodal Officer - Case ID: {caseId}',
            body: `Dear Nodal Officer,

We are reporting a comprehensive fraud case requiring your immediate attention and formal 91 CrPC proceedings:

SCAMMER DETAILS:
- Phone Number: {scammerPhone}
- Email: {scammerEmail}
- UPI ID: {scammerUpiId}
- Bank Account: {scammerBankAccount}
- IFSC Code: {scammerIfscCode}
- Name: {scammerName}
- Address: {scammerAddress}

CASE DETAILS:
- Case ID: {caseId}
- Victim: {victimName}
- Victim Phone: {victimPhone}
- Victim Email: {victimEmail}
- Victim Address: {victimAddress}
- Amount Lost: ₹{amount}
- Incident Date: {incidentDate}
- Description: {description}

EVIDENCE:
- Evidence Type: {evidenceTypes}
- Total Evidence Files: {evidenceCount}

LEGAL NOTICE:
This case is filed under Section 91 of the Code of Criminal Procedure (CrPC) and requires immediate formal proceedings.

This case requires immediate attention and formal 91 CrPC proceedings.

This is an automated message from the 91 CrPC Fraud Reporting System.

Best regards,
Fraud Investigation Team
Cyber Crime Division`
          }
        },
        settings: {
          autoSend: true,
          retryAttempts: 3,
          retryDelay: 300000, // 5 minutes
          maxEmailsPerDay: 100,
          requireApproval: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('emailConfig').insertOne(defaultConfig);
      emailConfig = defaultConfig;
    }
    
    res.json({
      success: true,
      config: emailConfig
    });
    
  } catch (error) {
    console.error('Get email config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update email configuration
router.put('/config', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { recipients, templates, settings } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (recipients) updateData.recipients = recipients;
    if (templates) updateData.templates = templates;
    if (settings) updateData.settings = settings;
    
    const result = await db.collection('emailConfig').updateOne(
      { type: 'default' },
      { $set: updateData },
      { upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Email configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Update email config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add new email recipient
router.post('/recipients', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { type, recipient } = req.body;
    
    if (!type || !recipient) {
      return res.status(400).json({
        success: false,
        message: 'Type and recipient data are required'
      });
    }
    
    const result = await db.collection('emailConfig').updateOne(
      { type: 'default' },
      { 
        $set: { 
          [`recipients.${type}`]: recipient,
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Email recipient added successfully'
    });
    
  } catch (error) {
    console.error('Add email recipient error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get email history
router.get('/history', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 20, caseId } = req.query;
    
    const query = {};
    if (caseId) {
      query.caseId = new ObjectId(caseId);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const emails = await db.collection('sent_emails')
      .find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const totalEmails = await db.collection('sent_emails').countDocuments(query);
    
    res.json({
      success: true,
      emails: emails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEmails / parseInt(limit)),
        totalEmails,
        hasNext: skip + parseInt(limit) < totalEmails,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Get email history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test email configuration
router.post('/test', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { emailType, testData } = req.body;
    
    // Get email configuration
    const emailConfig = await db.collection('emailConfig').findOne({ type: 'default' });
    
    if (!emailConfig || !emailConfig.recipients[emailType]) {
      return res.status(404).json({
        success: false,
        message: 'Email configuration not found'
      });
    }
    
    const recipient = emailConfig.recipients[emailType];
    const template = emailConfig.templates[emailType];
    
    // In a real implementation, you would send the actual email here
    // For now, we'll just log it and return success
    
    console.log('Test email would be sent to:', recipient.email);
    console.log('Subject:', template.subject);
    console.log('Body:', template.body);
    
    res.json({
      success: true,
      message: 'Test email configuration is valid',
      recipient: recipient,
      subject: template.subject
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
