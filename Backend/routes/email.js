const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Email templates for different authorities
const emailTemplates = {
  telecom: {
    subject: 'URGENT: Fraud Complaint - Telecom Department - Case ID: ${caseDetails.caseId}',
    template: (scammerDetails, caseDetails) => `
Dear Telecom Department,

We are writing to report a fraudulent activity involving the following phone number that requires immediate attention:

SCAMMER DETAILS:
- Phone Number: ${scammerDetails.phoneNumber || 'Not provided'}
- Name: ${scammerDetails.name || 'Unknown'}
- Address: ${scammerDetails.address || 'Not provided'}
- Email: ${scammerDetails.email || 'Not provided'}

CASE DETAILS:
- Case ID: ${caseDetails.caseId}
- Victim: ${caseDetails.user?.name || 'Unknown'}
- Victim Phone: ${caseDetails.user?.phone || 'Not provided'}
- Victim Email: ${caseDetails.user?.email || 'Not provided'}
- Amount Lost: ₹${caseDetails.amount?.toLocaleString() || '0'}
- Incident Date: ${new Date(caseDetails.createdAt).toLocaleDateString()}
- Description: ${caseDetails.description || 'No description provided'}

EVIDENCE:
- Evidence Type: ${scammerDetails.evidenceTypes?.join(', ') || 'Screenshots and documents'}
- Total Evidence Files: ${caseDetails.evidence?.length || 0}

LEGAL NOTICE:
This complaint is filed under Section 91 of the Code of Criminal Procedure (CrPC) and requires immediate investigation. The fraudulent use of this phone number has caused significant financial loss to the victim.

Please take necessary action against this fraudulent number and provide us with updates on the investigation within 48 hours.

This is an automated message from the 91 CrPC Fraud Reporting System.

Best regards,
Fraud Investigation Team
Cyber Crime Division
    `
  },

  bank: {
    subject: 'URGENT: Banking Fraud Complaint - Case ID: ${caseDetails.caseId}',
    template: (scammerDetails, caseDetails) => `
Dear Bank Authority,

We are reporting a fraudulent banking activity involving the following account details that requires immediate investigation:

SCAMMER BANK DETAILS:
- Bank Account: ${scammerDetails.bankAccount || 'Not provided'}
- IFSC Code: ${scammerDetails.ifscCode || 'Not provided'}
- UPI ID: ${scammerDetails.upiId || 'Not provided'}
- Name: ${scammerDetails.name || 'Unknown'}
- Phone: ${scammerDetails.phoneNumber || 'Not provided'}
- Email: ${scammerDetails.email || 'Not provided'}

CASE DETAILS:
- Case ID: ${caseDetails.caseId}
- Victim: ${caseDetails.user?.name || 'Unknown'}
- Victim Phone: ${caseDetails.user?.phone || 'Not provided'}
- Victim Email: ${caseDetails.user?.email || 'Not provided'}
- Amount Lost: ₹${caseDetails.amount?.toLocaleString() || '0'}
- Incident Date: ${new Date(caseDetails.createdAt).toLocaleDateString()}
- Description: ${caseDetails.description || 'No description provided'}

EVIDENCE:
- Evidence Type: ${scammerDetails.evidenceTypes?.join(', ') || 'Bank statements and transaction screenshots'}
- Total Evidence Files: ${caseDetails.evidence?.length || 0}

LEGAL NOTICE:
This complaint is filed under Section 91 of the Code of Criminal Procedure (CrPC) and banking regulations. The fraudulent use of this banking information has caused significant financial loss to the victim.

Please investigate this account immediately and take appropriate action under banking regulations. We request a freeze on this account pending investigation.

This is an automated message from the 91 CrPC Fraud Reporting System.

Best regards,
Fraud Investigation Team
Cyber Crime Division
    `
  },

  nodal: {
    subject: 'URGENT: Comprehensive Fraud Case - Nodal Officer - Case ID: ${caseDetails.caseId}',
    template: (scammerDetails, caseDetails) => `
Dear Nodal Officer,

We are reporting a comprehensive fraud case requiring your immediate attention and formal 91 CrPC proceedings:

SCAMMER DETAILS:
- Phone Number: ${scammerDetails.phoneNumber || 'Not provided'}
- Email: ${scammerDetails.email || 'Not provided'}
- UPI ID: ${scammerDetails.upiId || 'Not provided'}
- Bank Account: ${scammerDetails.bankAccount || 'Not provided'}
- IFSC Code: ${scammerDetails.ifscCode || 'Not provided'}
- Name: ${scammerDetails.name || 'Unknown'}
- Address: ${scammerDetails.address || 'Not provided'}

CASE DETAILS:
- Case ID: ${caseDetails.caseId}
- Victim: ${caseDetails.user?.name || 'Unknown'}
- Victim Phone: ${caseDetails.user?.phone || 'Not provided'}
- Victim Email: ${caseDetails.user?.email || 'Not provided'}
- Victim Address: ${caseDetails.user?.address || 'Not provided'}
- Amount Lost: ₹${caseDetails.amount?.toLocaleString() || '0'}
- Incident Date: ${new Date(caseDetails.createdAt).toLocaleDateString()}
- Description: ${caseDetails.description || 'No description provided'}

EVIDENCE:
- Evidence Type: ${scammerDetails.evidenceTypes?.join(', ') || 'Comprehensive evidence package'}
- Total Evidence Files: ${caseDetails.evidence?.length || 0}

LEGAL NOTICE:
This case is filed under Section 91 of the Code of Criminal Procedure (CrPC) and requires immediate formal proceedings. The scammer has used multiple channels (phone, email, banking) to defraud the victim.

This case requires immediate attention and formal 91 CrPC proceedings. We request expedited processing due to the severity of the fraud.

This is an automated message from the 91 CrPC Fraud Reporting System.

Best regards,
Fraud Investigation Team
Cyber Crime Division
    `
  }
};

// Helper function to get email recipient from database
async function getEmailRecipient(db, emailType) {
  try {
    const emailConfig = await db.collection('emailConfig').findOne({ type: 'default' });
    if (emailConfig && emailConfig.recipients && emailConfig.recipients[emailType]) {
      return emailConfig.recipients[emailType];
    }
  } catch (error) {
    console.error('Error getting email recipient:', error);
  }

  // Fallback to default recipients from environment variables
  const defaultRecipients = {
    telecom: { email: process.env.TELECOM_EMAIL || 'telecom@fraud.gov.in', name: 'Telecom Department' },
    bank: { email: process.env.BANKING_EMAIL || 'banking@fraud.gov.in', name: 'Banking Authority' },
    nodal: { email: process.env.NODAL_EMAIL || 'nodal@fraud.gov.in', name: 'Nodal Officer' }
  };
  return defaultRecipients[emailType] || { email: 'admin@fraud.gov.in', name: 'Admin' };
}

// Helper function to generate 91 CrPC content
function generate91CrPCContent(caseDetails, scammerDetails, userDetails, userProfile) {
  const currentDate = new Date().toLocaleDateString('en-IN');

  return `
IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE
CYBER CRIME DIVISION

CASE NO: ${caseDetails.caseId}
DATE: ${currentDate}

APPLICATION UNDER SECTION 91 OF THE CODE OF CRIMINAL PROCEDURE, 1973

BEFORE THE HON'BLE COURT

The undersigned respectfully submits as follows:

1. That the applicant is a victim of cyber fraud committed by the accused person(s) as detailed below.

2. VICTIM DETAILS:
   Name: ${userDetails?.name || 'Unknown'}
   Address: ${userProfile?.addressInfo?.streetAddress ?
      `${userProfile.addressInfo.streetAddress}, ${userProfile.addressInfo.city}, ${userProfile.addressInfo.state} ${userProfile.addressInfo.postalCode}` :
      userDetails?.address || 'Address not provided'}
   Phone: ${userDetails?.phone || 'Not provided'}
   Email: ${userDetails?.email || 'Not provided'}
   Aadhaar: ${userProfile?.governmentIds?.aadhaarNumber || 'Not provided'}
   PAN: ${userProfile?.governmentIds?.panNumber || 'Not provided'}

3. ACCUSED DETAILS:
   Name: ${scammerDetails.name || 'Unknown'}
   Phone: ${scammerDetails.phoneNumber || 'Not provided'}
   Email: ${scammerDetails.email || 'Not provided'}
   UPI ID: ${scammerDetails.upiId || 'Not provided'}
   Bank Account: ${scammerDetails.bankAccount || 'Not provided'}
   IFSC Code: ${scammerDetails.ifscCode || 'Not provided'}
   Address: ${scammerDetails.address || 'Not provided'}

4. INCIDENT DETAILS:
   Date of Incident: ${new Date(caseDetails.createdAt).toLocaleDateString('en-IN')}
   Amount Lost: ₹${caseDetails.amount?.toLocaleString() || '0'}
   Case Type: ${caseDetails.caseType || 'Cyber Fraud'}
   Description: ${caseDetails.description || 'No description provided'}

5. EVIDENCE:
   - Total Evidence Files: ${caseDetails.evidence?.length || 0}
   - Screenshots and documents attached
   - Bank statements and transaction records
   - Communication records

6. PRAYER:
   It is therefore most respectfully prayed that this Hon'ble Court may be pleased to:
   a) Direct the concerned authorities to investigate the matter
   b) Freeze the accused's bank accounts and UPI IDs
   c) Take appropriate legal action against the accused
   d) Provide justice to the victim

AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL EVER REMAIN GRATEFUL.

DATED: ${currentDate}

Respectfully submitted,
Cyber Crime Division
Fraud Investigation Team

VERIFICATION:
I, the undersigned, do hereby verify that the contents of the above application are true and correct to the best of my knowledge and belief.

DATED: ${currentDate}

Signature: ________________
Name: Fraud Investigation Team
Designation: Cyber Crime Division
  `;
}

// Send automated emails
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { caseId, scammerId, emailTypes } = req.body;
    const db = req.app.locals.db;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get case details
    const caseDetails = await db.collection('cases').findOne({
      _id: new ObjectId(caseId)
    });

    if (!caseDetails) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Get scammer details
    const scammerDetails = await db.collection('scammers').findOne({
      _id: new ObjectId(scammerId)
    });

    if (!scammerDetails) {
      return res.status(404).json({
        success: false,
        message: 'Scammer not found'
      });
    }

    const sentEmails = [];

    // Get user details for email templates
    const userDetails = await db.collection('users').findOne({ _id: caseDetails.userId });
    const userProfile = await db.collection('userProfiles').findOne({ userId: caseDetails.userId });

    // Enhance case details with user information
    const enhancedCaseDetails = {
      ...caseDetails,
      user: {
        name: userDetails?.name || 'Unknown',
        email: userDetails?.email || 'Not provided',
        phone: userDetails?.phone || 'Not provided',
        address: userProfile?.addressInfo?.streetAddress ?
          `${userProfile.addressInfo.streetAddress}, ${userProfile.addressInfo.city}, ${userProfile.addressInfo.state} ${userProfile.addressInfo.postalCode}` :
          userDetails?.address || 'Address not provided'
      }
    };

    // Get email configuration from database
    const emailConfig = await db.collection('emailConfig').findOne({ type: 'default' });
    const templates = emailConfig?.templates || emailTemplates;
    const recipients = emailConfig?.recipients || {};

    // Send emails based on scammer details
    // Configure transporter
    let transporter = null;
    if (process.env.SMTP_HOST) {
      const nodemailer = require('nodemailer');
      const isGmail = process.env.SMTP_HOST.includes('gmail');
      console.log(`Creating transporter for ${process.env.SMTP_HOST}${isGmail ? ' (via Gmail service)' : ''}`);

      const config = {
        service: isGmail ? 'gmail' : undefined,
        host: isGmail ? undefined : process.env.SMTP_HOST,
        port: isGmail ? undefined : (parseInt(process.env.SMTP_PORT) || 587),
        secure: isGmail ? undefined : (process.env.SMTP_PORT === '465'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      if (!isGmail) {
        config.tls = { rejectUnauthorized: false };
      }

      transporter = nodemailer.createTransport(config);
    }

    for (const emailType of emailTypes) {
      if (templates[emailType]) {
        const template = templates[emailType];
        const recipient = await getEmailRecipient(db, emailType);

        // Generate email content with placeholders
        let emailContent = template.body || template.template(scammerDetails, enhancedCaseDetails);
        let subject = template.subject || `Fraud Complaint - ${emailType}`;

        // Replace placeholders in content and subject
        const placeholders = {
          '{caseId}': enhancedCaseDetails.caseId,
          '{scammerPhone}': scammerDetails.phoneNumber || 'Not provided',
          '{scammerName}': scammerDetails.name || 'Unknown',
          '{scammerAddress}': scammerDetails.address || 'Not provided',
          '{scammerEmail}': scammerDetails.email || 'Not provided',
          '{scammerBankAccount}': scammerDetails.bankAccount || 'Not provided',
          '{scammerIfscCode}': scammerDetails.ifscCode || 'Not provided',
          '{scammerUpiId}': scammerDetails.upiId || 'Not provided',
          '{victimName}': enhancedCaseDetails.user.name || 'Unknown',
          '{victimPhone}': enhancedCaseDetails.user.phone || 'Not provided',
          '{victimEmail}': enhancedCaseDetails.user.email || 'Not provided',
          '{victimAddress}': enhancedCaseDetails.user.address || 'Not provided',
          '{amount}': enhancedCaseDetails.amount?.toLocaleString() || '0',
          '{incidentDate}': new Date(enhancedCaseDetails.createdAt).toLocaleDateString('en-IN'),
          '{description}': enhancedCaseDetails.description || 'No description provided',
          '{evidenceTypes}': scammerDetails.evidenceTypes?.join(', ') || 'Screenshots and documents',
          '{evidenceCount}': enhancedCaseDetails.evidence?.length || 0
        };

        // Replace all placeholders
        Object.keys(placeholders).forEach(placeholder => {
          emailContent = emailContent.replace(new RegExp(placeholder, 'g'), placeholders[placeholder]);
          subject = subject.replace(new RegExp(placeholder, 'g'), placeholders[placeholder]);
        });

        // Send actual email if transporter exists
        let emailStatus = 'sent';
        if (transporter) {
          try {
            console.log(`Sending real email to ${recipient.email}...`);
            const info = await transporter.sendMail({
              from: process.env.SMTP_USER || '"FraudLens System" <system@fraudlens.com>',
              to: recipient.email,
              subject: subject,
              text: emailContent
            });
            console.log(`✅ Email sent successfully to ${recipient.email}. MessageId: ${info.messageId}`);
          } catch (err) {
            console.error(`❌ Failed to send email to ${recipient.email}:`, err);
            emailStatus = 'failed';
          }
        } else {
          console.log('⚠️ SMTP not configured, skipping actual email send.');
        }

        // Store email in database
        const emailRecord = {
          caseId: new ObjectId(caseId),
          scammerId: new ObjectId(scammerId),
          emailType: emailType,
          subject: subject,
          content: emailContent,
          sentAt: new Date(),
          sentBy: req.user.userId,
          status: emailStatus,
          recipient: recipient,
          priority: recipient.priority || 'high',
          department: recipient.department || emailType
        };

        await db.collection('sent_emails').insertOne(emailRecord);
        if (emailStatus === 'sent') {
          sentEmails.push(emailType);
        }
      }
    }

    // Update case status to evidence_collected
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      {
        $set: {
          status: 'emails_sent',
          'flow.currentStep': 4,
          'flow.steps.3.status': 'completed',
          'flow.steps.3.completedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add/Update timeline entry
    await db.collection('case_timeline').updateOne(
      { caseId: new ObjectId(caseId), stage: 'Authorities Notified' },
      {
        $set: {
          status: 'completed',
          description: `Legal notices and documents sent to: ${sentEmails.join(', ')}`,
          completedAt: new Date().toISOString(),
          icon: '📧',
          updatedAt: new Date(),
          adminAction: true,
          adminName: req.user?.name || 'Admin',
          action: 'send_emails'
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Emails sent successfully',
      sentEmails: sentEmails
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate 91 CrPC document
router.post('/generate-91crpc', authenticateToken, async (req, res) => {
  try {
    const { caseId, scammerId } = req.body;
    const db = req.app.locals.db;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get case and scammer details
    const caseDetails = await db.collection('cases').findOne({
      _id: new ObjectId(caseId)
    });
    const scammerDetails = await db.collection('scammers').findOne({
      _id: new ObjectId(scammerId)
    });

    if (!caseDetails || !scammerDetails) {
      return res.status(404).json({
        success: false,
        message: 'Case or scammer not found'
      });
    }

    // Get comprehensive user details
    const userDetails = await db.collection('users').findOne({ _id: caseDetails.userId });
    const userProfile = await db.collection('userProfiles').findOne({ userId: caseDetails.userId });

    // Generate 91 CrPC document
    const crpcDocument = {
      caseId: caseDetails.caseId,
      documentNumber: `91CRPC-${Date.now()}`,
      victimDetails: {
        name: userDetails?.name || 'Unknown',
        email: userDetails?.email || 'Not provided',
        phone: userDetails?.phone || 'Not provided',
        address: userProfile?.addressInfo?.streetAddress ?
          `${userProfile.addressInfo.streetAddress}, ${userProfile.addressInfo.city}, ${userProfile.addressInfo.state} ${userProfile.addressInfo.postalCode}` :
          userDetails?.address || 'Address not provided',
        dateOfBirth: userProfile?.personalInfo?.dateOfBirth || 'Not provided',
        aadhaarNumber: userProfile?.governmentIds?.aadhaarNumber || 'Not provided',
        panNumber: userProfile?.governmentIds?.panNumber || 'Not provided'
      },
      scammerDetails: {
        name: scammerDetails.name,
        phoneNumber: scammerDetails.phoneNumber,
        email: scammerDetails.email,
        upiId: scammerDetails.upiId,
        bankAccount: scammerDetails.bankAccount,
        ifscCode: scammerDetails.ifscCode,
        address: scammerDetails.address,
        totalCases: scammerDetails.totalCases,
        status: scammerDetails.status
      },
      caseDetails: {
        amount: caseDetails.amount,
        description: caseDetails.description,
        incidentDate: caseDetails.createdAt,
        evidenceCount: caseDetails.evidence?.length || 0,
        caseType: caseDetails.caseType,
        priority: caseDetails.priority
      },
      legalNotice: {
        section: 'Section 91 of the Code of Criminal Procedure (CrPC)',
        urgency: 'High Priority - Immediate Action Required',
        jurisdiction: 'Cyber Crime Division',
        deadline: '48 hours for initial response'
      },
      generatedAt: new Date(),
      generatedBy: req.user.userId,
      status: 'generated',
      crpcContent: generate91CrPCContent(caseDetails, scammerDetails, userDetails, userProfile)
    };

    // Store 91 CrPC document
    await db.collection('crpc_documents').insertOne(crpcDocument);

    // Update case status
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      {
        $set: {
          status: 'crpc_generated',
          'flow.currentStep': 3,
          'flow.steps.2.status': 'completed',
          'flow.steps.2.completedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add/Update timeline entry
    await db.collection('case_timeline').updateOne(
      { caseId: new ObjectId(caseId), stage: '91 CrPC Generated' },
      {
        $set: {
          status: 'completed',
          description: 'Legal document generated under Section 91 of CrPC and queued for authorities.',
          completedAt: new Date().toISOString(),
          icon: '⚖️',
          updatedAt: new Date(),
          adminAction: true,
          adminName: req.user?.name || 'Admin',
          action: 'generate_crpc'
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: '91 CrPC document generated successfully',
      document: crpcDocument
    });

  } catch (error) {
    console.error('Generate 91 CrPC error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sent emails for a case
router.get('/case/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;

    // Find the case first to get the unified ObjectId
    let caseDoc;
    if (ObjectId.isValid(caseId) && caseId.length === 24) {
      caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    }

    if (!caseDoc) {
      caseDoc = await db.collection('cases').findOne({ caseId: caseId });
    }

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Always fetch by the document's internal _id
    const emails = await db.collection('sent_emails').find({
      caseId: caseDoc._id
    }).sort({ sentAt: -1 }).toArray();

    res.json({
      success: true,
      emails: emails
    });

  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
