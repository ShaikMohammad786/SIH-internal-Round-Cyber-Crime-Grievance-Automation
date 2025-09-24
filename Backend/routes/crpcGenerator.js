const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const { sendEmailsToAuthorities } = require('../services/emailService');
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

// Generate 91 CrPC document
router.post('/generate/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;

    // Get case details
    const caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Get user details
    const user = await db.collection('users').findOne({ _id: caseDoc.userId });
    const userProfile = await db.collection('userProfiles').findOne({ userId: caseDoc.userId });

    // Get scammer details
    const scammer = await db.collection('scammers').findOne({ 
      cases: { $in: [caseDoc.caseId] } 
    });

    // Generate 91 CrPC document
    const crpcDocument = await generate91CrPCDocument(caseDoc, user, userProfile, scammer);

    // Save CRPC document to database
    const crpcRecord = {
      caseId: new ObjectId(caseId),
      caseIdString: caseDoc.caseId,
      documentType: '91_crpc',
      documentNumber: generateDocumentNumber(),
      generatedBy: new ObjectId(req.user.userId),
      generatedAt: new Date(),
      status: 'generated',
      content: crpcDocument,
      recipients: {
        telecom: {
          email: 'telecom@fraud.gov.in',
          department: 'Telecom Regulatory Authority',
          status: 'pending'
        },
        banking: {
          email: 'banking@fraud.gov.in',
          department: 'Reserve Bank of India',
          status: 'pending'
        },
        nodal: {
          email: 'nodal@fraud.gov.in',
          department: 'Cyber Crime Division',
          status: 'pending'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🔧 Inserting CRPC document:', crpcRecord);
    const result = await db.collection('crpc_documents').insertOne(crpcRecord);
    console.log('✅ CRPC document inserted with ID:', result.insertedId);

    // Update case status
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $set: { 
          status: 'crpc_generated',
          crpcDocumentId: result.insertedId,
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: 'crpc_generated',
      stageName: '91 CrPC Generated',
      description: 'Legal document generated under Section 91 of CrPC',
      icon: '📋',
      userVisible: true,
      adminComment: `Document Number: ${crpcRecord.documentNumber}`,
      createdBy: new ObjectId(req.user.userId),
      createdByRole: 'admin',
      createdAt: new Date(),
      metadata: {
        documentId: result.insertedId,
        documentNumber: crpcRecord.documentNumber
      }
    });

    res.json({
      success: true,
      message: '91 CrPC document generated successfully',
      data: {
        documentId: result.insertedId,
        documentNumber: crpcRecord.documentNumber,
        caseId: caseDoc.caseId,
        generatedAt: crpcRecord.generatedAt
      }
    });

  } catch (error) {
    console.error('Generate 91 CrPC error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating 91 CrPC document'
    });
  }
});

// Send 91 CrPC to authorities
router.post('/send/:caseId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { recipients } = req.body;
    const db = req.app.locals.db;
    
    console.log('📧 CRPC Send - Case ID from params:', caseId);
    console.log('📧 CRPC Send - Recipients:', recipients);

    // Get CRPC document
    const crpcDoc = await db.collection('crpc_documents').findOne({ 
      caseId: new ObjectId(caseId) 
    });

    if (!crpcDoc) {
      return res.status(404).json({
        success: false,
        message: '91 CrPC document not found'
      });
    }

    // Get case details
    const caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    const user = await db.collection('users').findOne({ _id: caseDoc.userId });
    const scammer = await db.collection('scammers').findOne({ 
      cases: { $in: [caseDoc.caseId] } 
    });

    // Send emails to authorities
    const emailResults = await sendCrpcToAuthorities(crpcDoc, caseDoc, user, scammer, recipients);

    // Update CRPC document status with proper email results
    await db.collection('crpc_documents').updateOne(
      { _id: crpcDoc._id },
      { 
        $set: { 
          status: 'sent',
          sentAt: new Date(),
          recipients: emailResults,
          emailResults: emailResults,
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    // Update case status to "Authorities Notified"
    console.log('📧 Updating case status for caseId:', caseId);
    console.log('📧 Case ID type:', typeof caseId);
    console.log('📧 Case ID length:', caseId.length);
    
    // Try to find the case first
    const caseToUpdate = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    console.log('📧 Case found:', !!caseToUpdate);
    if (caseToUpdate) {
      console.log('📧 Current case status:', caseToUpdate.status);
    }
    
    const caseUpdateResult = await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $set: { 
          status: 'Authorities Notified',
          lastUpdated: new Date(),
          emailStatus: {
            lastSent: new Date(),
            recipients: Object.keys(emailResults),
            results: emailResults
          }
        }
      }
    );
    console.log('📧 Case update result:', caseUpdateResult);

    const timelineEntry = {
      caseId: new ObjectId(caseId),
      stage: 'emails_sent',
      stageName: 'Authorities Notified',
      status: 'completed',
      description: '91 CrPC document sent to relevant authorities',
      icon: '📧',
      userVisible: true,
      adminComment: `Sent to: ${Object.keys(emailResults).join(', ')}`,
      createdBy: new ObjectId(req.user.userId),
      createdByRole: 'admin',
      createdAt: new Date(),
      completedAt: new Date(),
      metadata: {
        recipients: Object.keys(emailResults),
        emailResults: emailResults
      }
    };
    console.log('📧 Adding timeline entry:', timelineEntry);
    const timelineResult = await db.collection('case_timeline').insertOne(timelineEntry);
    console.log('📧 Timeline insert result:', timelineResult);

    res.json({
      success: true,
      message: '91 CrPC document sent to authorities successfully',
      data: {
        recipients: Object.keys(emailResults),
        sentAt: new Date(),
        emailResults: emailResults
      }
    });

  } catch (error) {
    console.error('Send 91 CrPC error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending 91 CrPC document'
    });
  }
});

// Get CRPC document
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;

    const crpcDoc = await db.collection('crpc_documents').findOne({ 
      caseId: new ObjectId(caseId) 
    });

    if (!crpcDoc) {
      return res.status(404).json({
        success: false,
        message: '91 CrPC document not found'
      });
    }

    res.json({
      success: true,
      data: crpcDoc
    });

  } catch (error) {
    console.error('Get CRPC document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving 91 CrPC document'
    });
  }
});

// Generate 91 CrPC document content
async function generate91CrPCDocument(caseDoc, user, userProfile, scammer) {
  const currentDate = new Date();
  const documentNumber = generateDocumentNumber();
  
  const crpcContent = {
    documentType: '91 CrPC Notice',
    documentNumber: documentNumber,
    generatedDate: currentDate.toISOString(),
    caseDetails: {
      caseId: caseDoc.caseId,
      caseType: caseDoc.caseType,
      incidentDate: caseDoc.incidentDate,
      amount: caseDoc.amount,
      description: caseDoc.description
    },
    victimDetails: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      aadhaar: userProfile?.governmentIds?.aadhaarNumber || 'Not provided',
      pan: userProfile?.governmentIds?.panNumber || 'Not provided',
      address: userProfile?.addressInfo?.currentAddress || {},
      // Use form data if available
      formData: caseDoc.formData?.formData || {}
    },
    scammerDetails: {
      name: scammer?.name || 'Unknown',
      phone: scammer?.phoneNumber || 'Not provided',
      email: scammer?.email || 'Not provided',
      upiId: scammer?.upiId || 'Not provided',
      bankAccount: scammer?.bankAccount || 'Not provided',
      ifscCode: scammer?.ifscCode || 'Not provided',
      address: scammer?.address || 'Not provided'
    },
    legalNotice: {
      section: 'Section 91 of the Code of Criminal Procedure, 1973',
      purpose: 'Investigation of fraud and cybercrime',
      urgency: 'Immediate action required',
      compliance: 'Mandatory compliance within 48 hours'
    },
    authorities: {
      telecom: {
        department: 'Telecom Regulatory Authority of India',
        email: 'telecom@fraud.gov.in',
        jurisdiction: 'Telecom fraud and SIM card misuse'
      },
      banking: {
        department: 'Reserve Bank of India',
        email: 'banking@fraud.gov.in',
        jurisdiction: 'Banking fraud and financial crimes'
      },
      nodal: {
        department: 'Cyber Crime Division',
        email: 'nodal@fraud.gov.in',
        jurisdiction: 'Cyber crimes and digital fraud'
      }
    },
    evidence: {
      caseEvidence: caseDoc.evidence || [],
      scammerEvidence: scammer?.evidenceTypes || [],
      totalFiles: caseDoc.evidence?.length || 0
    },
    timeline: {
      reportSubmitted: caseDoc.createdAt,
      crpcGenerated: currentDate,
      expectedResponse: new Date(currentDate.getTime() + 48 * 60 * 60 * 1000) // 48 hours
    }
  };

  return crpcContent;
}

// Generate unique document number
function generateDocumentNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  return `91CRPC/${year}${month}${day}/${timestamp}`;
}

// Send CRPC to authorities
async function sendCrpcToAuthorities(crpcDoc, caseDoc, user, scammer, recipients) {
  try {
    // Use real email service
    const emailResults = await sendEmailsToAuthorities(caseDoc, scammer, recipients);
    
    // Convert results to expected format
    const formattedResults = {};
    for (const [authority, result] of Object.entries(emailResults)) {
      formattedResults[authority] = {
        success: result.success,
        status: result.success ? 'sent' : 'failed',
        email: getAuthorityEmail(authority),
        sentAt: new Date(),
        messageId: result.messageId || null,
        error: result.error || null
      };
    }
    
    return formattedResults;
  } catch (error) {
    console.error('Error sending CRPC emails:', error);
    throw error;
  }
}

// Get authority email addresses from environment variables
function getAuthorityEmail(authority) {
  const emails = {
    telecom: process.env.TELECOM_EMAIL || 'skbabaads2019@gmail.com',
    banking: process.env.BANKING_EMAIL || 'skmohammad786v@gmail.com',
    nodal: process.env.NODAL_EMAIL || 'nodal@fraud.gov.in'
  };
  return emails[authority] || 'unknown@fraud.gov.in';
}

// Generate email content
function generateEmailContent(crpcDoc, caseDoc, user, scammer) {
  return {
    subject: `URGENT: 91 CrPC Notice - Fraud Case ${caseDoc.caseId}`,
    body: `
Dear Authority,

This is an automated 91 CrPC notice generated by the FraudLens system for immediate investigation.

CASE DETAILS:
- Case ID: ${caseDoc.caseId}
- Document Number: ${crpcDoc.documentNumber}
- Victim: ${user.name} (${user.email})
- Amount Lost: ₹${caseDoc.amount?.toLocaleString() || '0'}
- Incident Date: ${new Date(caseDoc.incidentDate).toLocaleDateString()}

SCAMMER DETAILS:
- Name: ${scammer?.name || 'Unknown'}
- Phone: ${scammer?.phoneNumber || 'Not provided'}
- Email: ${scammer?.email || 'Not provided'}
- UPI ID: ${scammer?.upiId || 'Not provided'}
- Bank Account: ${scammer?.bankAccount || 'Not provided'}

LEGAL NOTICE:
This notice is issued under Section 91 of the Code of Criminal Procedure, 1973, requiring immediate investigation and action within 48 hours.

Please acknowledge receipt and provide updates on the investigation.

FraudLens System
Cyber Crime Division
    `,
    attachments: [
      {
        filename: `91CRPC_${caseDoc.caseId}.pdf`,
        content: 'PDF content would be generated here'
      }
    ]
  };
}

// Simulate email sending (replace with actual email service)
async function simulateEmailSending(email, content, authority) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`Sending email to ${authority} (${email}):`, content.subject);
  
  // In production, use actual email service
  // Example: await sendGrid.send(content);
  
  return true;
}

// Get CRPC documents for a case
router.get('/documents/:caseId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const userRole = req.user.role;

    // Check if user has access to this case
    const caseDoc = await db.collection('cases').findOne({
      $or: [
        { _id: new ObjectId(caseId) },
        { caseId: caseId }
      ]
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check access permissions
    if (userRole !== 'admin' && caseDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get CRPC documents for this case
    const documents = await db.collection('crpc_documents')
      .find({ caseId: caseDoc._id })
      .sort({ generatedAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          _id: doc._id,
          documentNumber: doc.documentNumber,
          caseIdString: doc.caseIdString,
          status: doc.status,
          generatedAt: doc.generatedAt,
          generatedBy: doc.generatedBy,
          recipients: doc.recipients,
          filePath: doc.filePath
        }))
      }
    });

  } catch (error) {
    console.error('Get CRPC documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving CRPC documents'
    });
  }
});

// Download CRPC document
router.get('/download/:documentId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { documentId } = req.params;

    const document = await db.collection('crpc_documents').findOne({
      _id: new ObjectId(documentId)
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this case
    const caseDoc = await db.collection('cases').findOne({
      _id: document.caseId
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && caseDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate actual PDF content using PDFKit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="91CRPC_${document.documentNumber}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('91 CrPC Document', 50, 50);
    doc.fontSize(16).text(`Document Number: ${document.documentNumber}`, 50, 80);
    doc.fontSize(14).text(`Case ID: ${document.caseIdString}`, 50, 110);
    doc.fontSize(12).text(`Generated: ${new Date(document.generatedAt).toLocaleString()}`, 50, 140);
    
    doc.moveDown();
    doc.fontSize(16).text('Case Details:', 50, 180);
    doc.fontSize(12).text(`Case Type: ${caseDoc.caseType}`, 50, 210);
    doc.text(`Amount: ₹${caseDoc.amount?.toLocaleString() || '0'}`, 50, 230);
    doc.text(`Status: ${caseDoc.status}`, 50, 250);
    
    doc.moveDown();
    doc.fontSize(16).text('Legal Notice:', 50, 290);
    doc.fontSize(12).text('This document is issued under Section 91 of the Code of Criminal Procedure, 1973.', 50, 320);
    doc.text('It requires immediate investigation and action by the relevant authorities.', 50, 340);
    
    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Download CRPC document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading document'
    });
  }
});

module.exports = router;
