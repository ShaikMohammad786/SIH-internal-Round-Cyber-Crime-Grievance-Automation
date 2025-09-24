const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const { sendEmailsToAuthorities } = require('../services/emailService');
const router = express.Router();

// Complete Case Management Flow
// This handles the entire flow from case submission to closure

// Step 1: Submit Case (User)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;
    
    const {
      caseType,
      description,
      amount,
      incidentDate,
      location,
      contactInfo,
      evidence,
      formData,
      scammerInfo
    } = req.body;

    console.log('🚀 Starting complete case flow for user:', userId);

    // Generate unique case ID
    const caseId = await generateUniqueCaseId(db);
    
    // Create case document
    const caseDoc = {
      caseId,
      userId: new ObjectId(userId),
      caseType,
      description,
      amount: Number(amount) || 0,
      incidentDate: new Date(incidentDate),
      location,
      contactInfo,
      evidence: evidence || [],
      formData,
      status: 'submitted',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      flow: {
        currentStep: 1,
        steps: [
          { step: 1, name: 'Report Submitted', status: 'completed', completedAt: new Date() },
          { step: 2, name: 'Information Verified', status: 'pending' },
          { step: 3, name: '91CRPC Generated', status: 'pending' },
          { step: 4, name: 'Email Sent', status: 'pending' },
          { step: 5, name: 'Authorized', status: 'pending' },
          { step: 6, name: 'Assigned to Police', status: 'pending' },
          { step: 7, name: 'Evidence Collected', status: 'pending' },
          { step: 8, name: 'Resolved', status: 'pending' },
          { step: 9, name: 'Closed', status: 'pending' }
        ]
      }
    };

    // Insert case
    const caseResult = await db.collection('cases').insertOne(caseDoc);
    console.log('✅ Case created with ID:', caseResult.insertedId);

    // Process scammer information
    let scammerId = null;
    if (scammerInfo) {
      scammerId = await processScammerInfo(db, scammerInfo, caseId);
      console.log('✅ Scammer processed with ID:', scammerId);
    }

    // Update case with scammer ID
    if (scammerId) {
      await db.collection('cases').updateOne(
        { _id: caseResult.insertedId },
        { $set: { scammerId: new ObjectId(scammerId) } }
      );
    }

    // Add timeline entry
    await addTimelineEntry(db, caseResult.insertedId, 'Report Submitted', 'completed', 
      'Initial report received and logged.', req.user);

    // Step 1 completed - now automatically process verification and 91CRPC generation
    console.log('✅ Step 1 completed - automatically processing verification and 91CRPC generation');

    // Automatically process information verification
    await processInformationVerification(db, caseResult.insertedId, caseId);
    console.log('✅ Information verification completed automatically');

    // Automatically generate 91CRPC document
    await process91CRPCGeneration(db, caseResult.insertedId, caseId);
    console.log('✅ 91CRPC generation completed automatically');

    res.json({
      success: true,
      message: 'Case submitted successfully with automatic verification and 91CRPC generation',
      case: {
        id: caseResult.insertedId,
        caseId,
        status: 'crpc_generated',
        currentStep: 3
      }
    });

  } catch (error) {
    console.error('❌ Case submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit case: ' + error.message
    });
  }
});

// Step 2: Information Verification (Automatic)
async function processInformationVerification(db, caseId, caseIdString) {
  try {
    console.log('🔍 Processing information verification for case:', caseIdString);
    
    // Update case status
    await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'verified',
          'flow.currentStep': 2,
          'flow.steps.1.status': 'completed',
          'flow.steps.1.completedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await addTimelineEntry(db, caseId, 'Information Verified', 'completed',
      'Personal and contact details verified automatically.', { name: 'System' });

    // Automatically proceed to Step 3: 91CRPC Generation
    await process91CRPCGeneration(db, caseId, caseIdString);

  } catch (error) {
    console.error('❌ Information verification error:', error);
  }
}

// Step 3: 91CRPC Generation (Automatic)
async function process91CRPCGeneration(db, caseId, caseIdString) {
  try {
    console.log('📋 Processing 91CRPC generation for case:', caseIdString);
    console.log('📋 Case ID type:', typeof caseId, caseId);
    
    // Get case details
    const caseDoc = await db.collection('cases').findOne({ _id: caseId });
    if (!caseDoc) {
      console.error('❌ Case not found for 91CRPC generation');
      return;
    }
    console.log('📋 Case found:', caseDoc.caseId, caseDoc.status);

    // Generate 91CRPC document
    console.log('📋 Generating 91CRPC document content...');
    const crpcDocument = await generate91CrPCDocument(caseDoc);
    console.log('📋 91CRPC document content generated:', !!crpcDocument);
    
    // Save CRPC document
    const documentNumber = generateDocumentNumber();
    console.log('📋 Generated document number:', documentNumber);
    
    const crpcRecord = {
      caseId: caseId,
      caseIdString: caseIdString,
      documentType: '91_crpc',
      documentNumber: documentNumber,
      generatedBy: new ObjectId('000000000000000000000000'), // System
      generatedAt: new Date(),
      status: 'generated',
      content: crpcDocument,
      recipients: {
        telecom: { email: process.env.TELECOM_EMAIL || 'telecom@fraud.gov.in', status: 'pending' },
        banking: { email: process.env.BANKING_EMAIL || 'banking@fraud.gov.in', status: 'pending' },
        nodal: { email: process.env.NODAL_EMAIL || 'nodal@fraud.gov.in', status: 'pending' }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📋 Inserting CRPC document into database...');
    const crpcResult = await db.collection('crpc_documents').insertOne(crpcRecord);
    console.log('✅ 91CRPC document generated with ID:', crpcResult.insertedId);

    // Update case status
    console.log('📋 Updating case status...');
    const caseUpdateResult = await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'crpc_generated',
          'flow.currentStep': 3,
          'flow.steps.2.status': 'completed',
          'flow.steps.2.completedAt': new Date(),
          crpcDocumentId: crpcResult.insertedId,
          updatedAt: new Date()
        }
      }
    );
    console.log('📋 Case update result:', caseUpdateResult.modifiedCount, 'documents modified');

    // Add timeline entry
    console.log('📋 Adding timeline entry...');
    const timelineResult = await addTimelineEntry(db, caseId, '91CRPC Generated', 'completed',
      'Legal document generated under Section 91 of CrPC', { name: 'System' });
    console.log('📋 Timeline entry result:', timelineResult);

    // Verify the document was created
    const verifyDoc = await db.collection('crpc_documents').findOne({ _id: crpcResult.insertedId });
    console.log('📋 Verification - Document exists:', !!verifyDoc);
    if (verifyDoc) {
      console.log('📋 Document details:', {
        id: verifyDoc._id,
        documentNumber: verifyDoc.documentNumber,
        status: verifyDoc.status,
        caseId: verifyDoc.caseIdString
      });
    }

    // Step 3 completed - now wait for admin to send emails
    console.log('✅ Step 3 completed - waiting for admin to send emails');

  } catch (error) {
    console.error('❌ 91CRPC generation error:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

// Step 4: Email Sending (Automatic)
async function processEmailSending(db, caseId, caseIdString, crpcRecord) {
  try {
    console.log('📧 Processing email sending for case:', caseIdString);
    
    // Get case and scammer details
    const caseDoc = await db.collection('cases').findOne({ _id: caseId });
    const scammerDoc = caseDoc.scammerId ? 
      await db.collection('scammers').findOne({ _id: caseDoc.scammerId }) : null;

    // Send emails to authorities
    const emailResults = await sendEmailsToAuthorities(caseDoc, scammerDoc, {
      telecom: true,
      banking: true,
      nodal: true
    });

    console.log('✅ Emails sent with results:', emailResults);
    
    // Count successful emails
    const successfulEmails = Object.values(emailResults).filter(result => result.success).length;
    const totalEmails = Object.keys(emailResults).length;
    console.log(`📧 Email summary: ${successfulEmails}/${totalEmails} emails sent successfully`);

    // Update case status
    await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'emails_sent',
          'flow.currentStep': 4,
          'flow.steps.3.status': 'completed',
          'flow.steps.3.completedAt': new Date(),
          emailStatus: {
            lastSent: new Date(),
            results: emailResults
          },
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await addTimelineEntry(db, caseId, 'Email Sent', 'completed',
      `Emails sent to authorities: ${successfulEmails}/${totalEmails} successful`, { name: 'System' });

    // Step 4 completed - now wait for admin to authorize
    console.log('✅ Step 4 completed - waiting for admin to authorize');

    // Return email results
    return {
      emailResults: emailResults,
      successfulEmails: successfulEmails,
      totalEmails: totalEmails
    };

  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw error;
  }
}

// Step 5: Authorization (Automatic)
async function processAuthorization(db, caseId, caseIdString) {
  try {
    console.log('✅ Processing authorization for case:', caseIdString);
    
    // Update case status
    await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'authorized',
          'flow.currentStep': 5,
          'flow.steps.4.status': 'completed',
          'flow.steps.4.completedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await addTimelineEntry(db, caseId, 'Authorized', 'completed',
      'Case authorized by system and ready for police assignment', { name: 'System' });

    // Automatically proceed to Step 6: Police Assignment
    await processPoliceAssignment(db, caseId, caseIdString);

  } catch (error) {
    console.error('❌ Authorization error:', error);
  }
}

// Step 6: Police Assignment (Automatic)
async function processPoliceAssignment(db, caseId, caseIdString) {
  try {
    console.log('👮 Processing police assignment for case:', caseIdString);
    
    // Update case status
    await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'assigned_to_police',
          'flow.currentStep': 6,
          'flow.steps.5.status': 'completed',
          'flow.steps.5.completedAt': new Date(),
          assignedTo: 'police_system',
          assignedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await addTimelineEntry(db, caseId, 'Assigned to Police', 'completed',
      'Case assigned to police for investigation', { name: 'System' });

    // Automatically proceed to Step 7: Evidence Collection
    await processEvidenceCollection(db, caseId, caseIdString);

  } catch (error) {
    console.error('❌ Police assignment error:', error);
  }
}

// Step 7: Evidence Collection (Automatic)
async function processEvidenceCollection(db, caseId, caseIdString) {
  try {
    console.log('📋 Processing evidence collection for case:', caseIdString);
    
    // Update case status
    await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'evidence_collected',
          'flow.currentStep': 7,
          'flow.steps.6.status': 'completed',
          'flow.steps.6.completedAt': new Date(),
          evidenceCollectedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await addTimelineEntry(db, caseId, 'Evidence Collected', 'completed',
      'Evidence collected and case ready for resolution', { name: 'System' });

    // Automatically proceed to Step 8: Resolution
    await processResolution(db, caseId, caseIdString);

  } catch (error) {
    console.error('❌ Evidence collection error:', error);
  }
}

// Step 8: Resolution (Automatic)
async function processResolution(db, caseId, caseIdString) {
  try {
    console.log('✅ Processing resolution for case:', caseIdString);
    
    // Update case status
    await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'resolved',
          'flow.currentStep': 8,
          'flow.steps.7.status': 'completed',
          'flow.steps.7.completedAt': new Date(),
          resolvedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await addTimelineEntry(db, caseId, 'Resolved', 'completed',
      'Case resolved by police and ready for closure', { name: 'System' });

    // Automatically proceed to Step 9: Closure
    await processClosure(db, caseId, caseIdString);

  } catch (error) {
    console.error('❌ Resolution error:', error);
  }
}

// Step 9: Closure (Automatic)
async function processClosure(db, caseId, caseIdString) {
  try {
    console.log('🔒 Processing closure for case:', caseIdString);
    
    // Update case status
    await db.collection('cases').updateOne(
      { _id: caseId },
      { 
        $set: { 
          status: 'closed',
          'flow.currentStep': 9,
          'flow.steps.8.status': 'completed',
          'flow.steps.8.completedAt': new Date(),
          'flow.steps.9.status': 'completed',
          'flow.steps.9.completedAt': new Date(),
          closedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await addTimelineEntry(db, caseId, 'Case Closed', 'completed',
      'Case successfully closed and archived', { name: 'System' });

    console.log('🎉 Complete case flow finished for case:', caseIdString);

  } catch (error) {
    console.error('❌ Closure error:', error);
  }
}

// Get case flow status
router.get('/status/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;

    let caseDoc;
    
    // Try to find by ObjectId first if it's a valid ObjectId
    if (ObjectId.isValid(caseId) && caseId.length === 24) {
      caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    }
    
    // If not found by ObjectId, try by caseId string
    if (!caseDoc) {
      caseDoc = await db.collection('cases').findOne({ caseId: caseId });
    }

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

    // Get timeline entries
    const timeline = await db.collection('case_timeline').find({
      caseId: caseDoc._id
    }).sort({ createdAt: 1 }).toArray();

    res.json({
      success: true,
      data: {
        case: {
          id: caseDoc._id,
          caseId: caseDoc.caseId,
          status: caseDoc.status,
          currentStep: caseDoc.flow?.currentStep || 1,
          steps: caseDoc.flow?.steps || [],
          createdAt: caseDoc.createdAt,
          updatedAt: caseDoc.updatedAt
        },
        timeline
      }
    });

  } catch (error) {
    console.error('Get case status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving case status'
    });
  }
});

// Manual step progression (Admin only)
router.post('/progress/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { step } = req.body;
    const db = req.app.locals.db;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    let caseDoc;
    
    // Try to find by ObjectId first if it's a valid ObjectId
    if (ObjectId.isValid(caseId) && caseId.length === 24) {
      caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    }
    
    // If not found by ObjectId, try by caseId string
    if (!caseDoc) {
      caseDoc = await db.collection('cases').findOne({ caseId: caseId });
    }

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Process the specific step
    let stepResult = {};
    switch (step) {
      case 2:
        await processInformationVerification(db, caseDoc._id, caseDoc.caseId);
        break;
      case 3:
        await process91CRPCGeneration(db, caseDoc._id, caseDoc.caseId);
        break;
      case 4:
        stepResult = await processEmailSending(db, caseDoc._id, caseDoc.caseId);
        break;
      case 5:
        await processAuthorization(db, caseDoc._id, caseDoc.caseId);
        break;
      case 6:
        await processPoliceAssignment(db, caseDoc._id, caseDoc.caseId);
        break;
      case 7:
        await processEvidenceCollection(db, caseDoc._id, caseDoc.caseId);
        break;
      case 8:
        await processResolution(db, caseDoc._id, caseDoc.caseId);
        break;
      case 9:
        await processClosure(db, caseDoc._id, caseDoc.caseId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid step number'
        });
    }

    res.json({
      success: true,
      message: `Step ${step} processed successfully`,
      data: stepResult
    });

  } catch (error) {
    console.error('Manual step progression error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing step'
    });
  }
});

// Helper functions
async function generateUniqueCaseId(db) {
  let caseId;
  let isUnique = false;
  
  while (!isUnique) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    caseId = `FRD-${timestamp}-${random}`;
    
    const existingCase = await db.collection('cases').findOne({ caseId });
    if (!existingCase) {
      isUnique = true;
    }
  }
  
  return caseId;
}

async function processScammerInfo(db, scammerInfo, caseId) {
  try {
    // Check if scammer already exists
    const existingScammer = await db.collection('scammers').findOne({
      $or: [
        { phoneNumber: scammerInfo.phone },
        { email: scammerInfo.email },
        { upiId: scammerInfo.upiId },
        { bankAccount: scammerInfo.bankAccount }
      ]
    });

    if (existingScammer) {
      // Update existing scammer
      await db.collection('scammers').updateOne(
        { _id: existingScammer._id },
        { 
          $addToSet: { cases: caseId },
          $set: { 
            lastSeen: new Date(),
            updatedAt: new Date()
          }
        }
      );
      return existingScammer._id;
    } else {
      // Create new scammer
      const newScammer = {
        name: scammerInfo.name || 'Unknown',
        phoneNumber: scammerInfo.phone || null,
        email: scammerInfo.email || null,
        upiId: scammerInfo.upiId || null,
        bankAccount: scammerInfo.bankAccount || null,
        ifscCode: scammerInfo.ifscCode || null,
        address: scammerInfo.address || null,
        cases: [caseId],
        totalCases: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      
      const result = await db.collection('scammers').insertOne(newScammer);
      return result.insertedId;
    }
  } catch (error) {
    console.error('Process scammer info error:', error);
    return null;
  }
}

async function addTimelineEntry(db, caseId, stage, status, description, user) {
  try {
    await db.collection('case_timeline').insertOne({
      caseId: caseId,
      stage: stage,
      status: status,
      description: description,
      completedAt: status === 'completed' ? new Date() : null,
      icon: getIconForStage(stage),
      createdBy: user.userId ? new ObjectId(user.userId) : null,
      createdByRole: user.role || 'system',
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Add timeline entry error:', error);
  }
}

function getIconForStage(stage) {
  const icons = {
    'Report Submitted': '📄',
    'Information Verified': '🔍',
    '91CRPC Generated': '📋',
    'Email Sent': '📧',
    'Authorized': '✅',
    'Assigned to Police': '👮',
    'Evidence Collected': '📋',
    'Resolved': '✅',
    'Case Closed': '🔒'
  };
  return icons[stage] || '📄';
}

async function generate91CrPCDocument(caseDoc) {
  const currentDate = new Date();
  const documentNumber = generateDocumentNumber();
  
  return {
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
      name: caseDoc.formData?.personalInfo?.firstName + ' ' + caseDoc.formData?.personalInfo?.lastName || 'Unknown',
      email: caseDoc.contactInfo?.email || 'Not provided',
      phone: caseDoc.contactInfo?.phone || 'Not provided',
      address: caseDoc.location?.address || 'Not provided'
    },
    legalNotice: {
      section: 'Section 91 of the Code of Criminal Procedure, 1973',
      purpose: 'Investigation of fraud and cybercrime',
      urgency: 'Immediate action required',
      compliance: 'Mandatory compliance within 48 hours'
    },
    generatedAt: currentDate
  };
}

function generateDocumentNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  return `91CRPC/${year}${month}${day}/${timestamp}`;
}

// Get 91CRPC document for download/view
router.get('/crpc/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;

    let caseDoc;
    
    // Try to find by ObjectId first if it's a valid ObjectId
    if (ObjectId.isValid(caseId) && caseId.length === 24) {
      caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    }
    
    // If not found by ObjectId, try by caseId string
    if (!caseDoc) {
      caseDoc = await db.collection('cases').findOne({ caseId: caseId });
    }

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Get CRPC document
    const crpcDoc = await db.collection('crpc_documents').findOne({
      caseId: caseDoc._id
    });

    if (!crpcDoc) {
      return res.status(404).json({
        success: false,
        message: '91CRPC document not found'
      });
    }

    res.json({
      success: true,
      data: {
        documentId: crpcDoc._id,
        documentNumber: crpcDoc.documentNumber,
        caseId: caseDoc.caseId,
        status: crpcDoc.status,
        generatedAt: crpcDoc.generatedAt,
        content: crpcDoc.content,
        downloadUrl: `/api/case-flow/crpc/download/${crpcDoc._id}`
      }
    });

  } catch (error) {
    console.error('Get CRPC document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving CRPC document'
    });
  }
});

// Download 91CRPC document as PDF
router.get('/crpc/download/:documentId', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Download request for document ID:', req.params.documentId);
    const { documentId } = req.params;
    const db = req.app.locals.db;

    console.log('📥 Looking for document in database...');
    const document = await db.collection('crpc_documents').findOne({
      _id: new ObjectId(documentId)
    });

    if (!document) {
      console.log('❌ Document not found in database');
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    console.log('📥 Document found:', document.documentNumber);

    // Get case details
    const caseDoc = await db.collection('cases').findOne({
      _id: document.caseId
    });

    if (!caseDoc) {
      console.log('❌ Case not found for document');
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    console.log('📥 Case found:', caseDoc.caseId);

    // Generate actual PDF content using PDFKit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      autoFirstPage: true
    });
    
    // Set response headers BEFORE piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="91CRPC_${document.documentNumber}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Pipe PDF to response
    doc.pipe(res, { end: false });
    
    // Add header
    doc.fontSize(24).text('91 CrPC Document', 50, 50, { align: 'center' });
    doc.fontSize(16).text(`Document Number: ${document.documentNumber}`, 50, 90);
    doc.fontSize(14).text(`Case ID: ${document.caseIdString}`, 50, 120);
    doc.fontSize(12).text(`Generated: ${new Date(document.generatedAt).toLocaleString()}`, 50, 150);
    
    // Add line separator
    doc.moveTo(50, 180).lineTo(550, 180).stroke();
    
    // Case Details Section
    doc.fontSize(18).text('Case Details', 50, 200);
    doc.fontSize(12).text(`Case Type: ${caseDoc.caseType || 'Not specified'}`, 50, 230);
    doc.text(`Amount Lost: ₹${caseDoc.amount?.toLocaleString() || '0'}`, 50, 250);
    doc.text(`Status: ${caseDoc.status || 'Unknown'}`, 50, 270);
    doc.text(`Incident Date: ${caseDoc.incidentDate || 'Not specified'}`, 50, 290);
    
    // Victim Details Section
    doc.fontSize(18).text('Victim Details', 50, 330);
    if (caseDoc.formData?.personalInfo) {
      const personalInfo = caseDoc.formData.personalInfo;
      doc.fontSize(12).text(`Name: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`, 50, 360);
      doc.text(`Date of Birth: ${personalInfo.dateOfBirth || 'Not provided'}`, 50, 380);
      doc.text(`Gender: ${personalInfo.gender || 'Not provided'}`, 50, 400);
    }
    
    // Scammer Details Section
    doc.fontSize(18).text('Suspect Details', 50, 440);
    if (caseDoc.scammerInfo) {
      const scammer = caseDoc.scammerInfo;
      doc.fontSize(12).text(`Name: ${scammer.name || 'Unknown'}`, 50, 470);
      doc.text(`Phone: ${scammer.phone || 'Not provided'}`, 50, 490);
      doc.text(`Email: ${scammer.email || 'Not provided'}`, 50, 510);
      doc.text(`UPI ID: ${scammer.upiId || 'Not provided'}`, 50, 530);
      doc.text(`Bank Account: ${scammer.bankAccount || 'Not provided'}`, 50, 550);
    }
    
    // Legal Notice Section
    doc.addPage();
    doc.fontSize(20).text('Legal Notice', 50, 50, { align: 'center' });
    doc.fontSize(14).text('Section 91 of the Code of Criminal Procedure, 1973', 50, 90, { align: 'center' });
    
    doc.fontSize(12).text('This document is issued under Section 91 of the Code of Criminal Procedure, 1973, requiring immediate investigation and action by the relevant authorities.', 50, 130);
    
    doc.text('The following authorities are hereby notified:', 50, 170);
    doc.text('• Telecom Regulatory Authority of India', 70, 190);
    doc.text('• Reserve Bank of India', 70, 210);
    doc.text('• Cyber Crime Division', 70, 230);
    
    doc.text('This notice requires immediate compliance within 48 hours of receipt.', 50, 270);
    
    // Footer
    doc.fontSize(10).text('Generated by FraudLens System', 50, 750, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, 770, { align: 'center' });
    
    // Handle PDF completion
    doc.on('end', () => {
      console.log('✅ PDF generation completed successfully');
      res.end();
    });
    
    doc.on('error', (error) => {
      console.error('❌ PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'PDF generation failed'
        });
      } else {
        res.end();
      }
    });
    
    // Finalize PDF
    doc.end();
    
    console.log('✅ PDF generation started');

  } catch (error) {
    console.error('❌ Download CRPC document error:', error);
    console.error('❌ Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error while downloading document'
      });
    }
  }
});

module.exports = router;
