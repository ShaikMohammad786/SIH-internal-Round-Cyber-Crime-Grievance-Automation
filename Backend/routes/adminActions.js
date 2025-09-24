const express = require('express');
const { ObjectId } = require('mongodb');
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

// Perform admin action on case
router.post('/:caseId/action', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { action, comment, metadata } = req.body;
    const db = req.app.locals.db;
    const adminId = req.user.userId;

    // Get case details
    const caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Perform action based on type
    let result;
    switch (action) {
      case 'verify_information':
        result = await verifyInformation(db, caseId, adminId, comment);
        break;
      case 'generate_crpc':
        result = await generateCrpc(db, caseId, adminId, comment);
        break;
      case 'send_emails':
        result = await sendEmails(db, caseId, adminId, comment);
        break;
      case 'update_status':
        result = await updateCaseStatus(db, caseId, req.body.newStatus, adminId, comment);
        break;
      case 'add_evidence':
        result = await addEvidence(db, caseId, adminId, comment, metadata);
        break;
      case 'investigate_scammer':
        result = await investigateScammer(db, caseId, adminId, comment);
        break;
      case 'resolve_case':
        result = await resolveCase(db, caseId, adminId, comment);
        break;
      case 'close_case':
        result = await closeCase(db, caseId, adminId, comment);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action type'
        });
    }

    res.json({
      success: true,
      message: `Action '${action}' completed successfully`,
      data: result
    });

  } catch (error) {
    console.error('Admin action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing admin action'
    });
  }
});

// Verify information action
async function verifyInformation(db, caseId, adminId, comment) {
  // Add timeline entry
  await db.collection('case_timeline').insertOne({
    caseId: new ObjectId(caseId),
    stage: 'information_verified',
    stageName: 'Information Verified',
    description: 'User details and scammer information verified by admin',
    icon: '🔍',
    userVisible: true,
    adminComment: comment,
    createdBy: new ObjectId(adminId),
    createdByRole: 'admin',
    createdAt: new Date(),
    metadata: {
      verifiedBy: adminId,
      verificationDate: new Date()
    }
  });

  // Update case status
  await db.collection('cases').updateOne(
    { _id: new ObjectId(caseId) },
    { 
      $set: { 
        status: 'verified',
        updatedAt: new Date()
      }
    }
  );

  // Log admin action
  await db.collection('admin_actions').insertOne({
    caseId: new ObjectId(caseId),
    action: 'verify_information',
    comment: comment,
    adminId: new ObjectId(adminId),
    createdAt: new Date()
  });

  return { stage: 'information_verified', status: 'verified' };
}

// Generate CRPC action
async function generateCrpc(db, caseId, adminId, comment) {
  try {
    // Get case data
    const caseData = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    if (!caseData) {
      throw new Error('Case not found');
    }

    // Check if scammer details exist
    if (!caseData.scammerDetails || caseData.scammerDetails.length === 0) {
      throw new Error('Scammer details must be collected before generating 91 CrPC');
    }

    // Generate CRPC document using the existing CRPC generator
    const { generateCrpcDocument } = require('./crpcGenerator');
    const crpcResult = await generateCrpcDocument(caseData, caseData.scammerDetails[0]);

    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: 'crpc_generated',
      stageName: '91 CrPC Generated',
      status: 'completed',
      description: 'Legal document generated under Section 91 of CrPC',
      icon: '⚖️',
      userVisible: true,
      adminComment: comment,
      createdBy: new ObjectId(adminId),
      createdByRole: 'admin',
      createdAt: new Date(),
      completedAt: new Date(),
      metadata: {
        generatedBy: adminId,
        documentType: '91_crpc',
        documentId: crpcResult.documentId
      }
    });

    // Update case status
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $set: { 
          status: 'crpc_generated',
          crpcDocumentId: crpcResult.documentId,
          updatedAt: new Date()
        }
      }
    );

    // Log admin action
    await db.collection('admin_actions').insertOne({
      caseId: new ObjectId(caseId),
      action: 'generate_crpc',
      comment: comment,
      adminId: new ObjectId(adminId),
      createdAt: new Date(),
      metadata: {
        documentId: crpcResult.documentId,
        success: true
      }
    });

    return { 
      stage: 'crpc_generated', 
      status: 'completed',
      documentId: crpcResult.documentId,
      message: '91 CrPC document generated successfully'
    };
  } catch (error) {
    console.error('Error generating CRPC:', error);
    
    // Log failed action
    await db.collection('admin_actions').insertOne({
      caseId: new ObjectId(caseId),
      action: 'generate_crpc',
      comment: comment,
      adminId: new ObjectId(adminId),
      createdAt: new Date(),
      metadata: {
        success: false,
        error: error.message
      }
    });
    
    throw error;
  }
}

// Send emails action
async function sendEmails(db, caseId, adminId, comment) {
  try {
    // Get case data
    const caseData = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    if (!caseData) {
      throw new Error('Case not found');
    }

    // Get scammer details
    const scammerData = await db.collection('scammers').findOne({ caseId: new ObjectId(caseId) });
    
    // Send emails to authorities
    const { sendEmailsToAuthorities } = require('../services/emailService');
    const emailResults = await sendEmailsToAuthorities(caseData, scammerData, {
      telecom: true,
      banking: true,
      nodal: true
    });

    // Update email status in case
    const emailStatus = {
      telecom: emailResults.telecom?.status || 'failed',
      banking: emailResults.banking?.status || 'failed',
      nodal: emailResults.nodal?.status || 'failed',
      lastSent: new Date(),
      sentBy: adminId
    };

    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: 'emails_sent',
      stageName: 'Authorities Notified',
      status: 'completed',
      description: '91 CrPC document sent to relevant authorities',
      icon: '📧',
      userVisible: true,
      adminComment: comment,
      createdBy: new ObjectId(adminId),
      createdByRole: 'admin',
      createdAt: new Date(),
      completedAt: new Date(),
      metadata: {
        sentBy: adminId,
        recipients: ['telecom', 'banking', 'nodal'],
        emailStatus: emailStatus
      }
    });

    // Update case status and email status
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $set: { 
          status: 'emails_sent',
          emailStatus: emailStatus,
          updatedAt: new Date()
        }
      }
    );

    // Log admin action
    await db.collection('admin_actions').insertOne({
      caseId: new ObjectId(caseId),
      action: 'send_emails',
      comment: comment,
      adminId: new ObjectId(adminId),
      createdAt: new Date(),
      metadata: {
        emailResults: emailResults
      }
    });

    return { 
      stage: 'emails_sent', 
      status: 'emails_sent',
      emailStatus: emailStatus,
      emailResults: emailResults
    };
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
}

// Update case status action
async function updateCaseStatus(db, caseId, newStatus, adminId, comment) {
  // Map status to appropriate stage
  const statusToStageMap = {
    'verified': 'information_verified',
    'under_review': 'under_review',
    'evidence_collected': 'evidence_collected',
    'resolved': 'case_resolved',
    'closed': 'case_closed'
  };

  const stage = statusToStageMap[newStatus] || 'under_review';
  const stageName = {
    'information_verified': 'Information Verified',
    'under_review': 'Under Review',
    'evidence_collected': 'Evidence Collected',
    'case_resolved': 'Case Resolved',
    'case_closed': 'Case Closed'
  }[stage] || 'Under Review';

  // Add timeline entry
  await db.collection('case_timeline').insertOne({
    caseId: new ObjectId(caseId),
    stage: stage,
    stageName: stageName,
    description: `Case status updated to: ${newStatus}`,
    icon: '🔍',
    userVisible: true,
    adminComment: comment,
    createdBy: new ObjectId(adminId),
    createdByRole: 'admin',
    createdAt: new Date(),
    metadata: {
      updatedBy: adminId,
      newStatus: newStatus
    }
  });

  // Update case status
  await db.collection('cases').updateOne(
    { _id: new ObjectId(caseId) },
    { 
      $set: { 
        status: newStatus,
        updatedAt: new Date()
      }
    }
  );

  // Log admin action
  await db.collection('admin_actions').insertOne({
    caseId: new ObjectId(caseId),
    action: 'update_status',
    comment: comment,
    adminId: new ObjectId(adminId),
    createdAt: new Date(),
    metadata: { newStatus }
  });

  return { stage: stage, status: newStatus };
}

// Add evidence action
async function addEvidence(db, caseId, adminId, comment, metadata) {
  // Add timeline entry
  await db.collection('case_timeline').insertOne({
    caseId: new ObjectId(caseId),
    stage: 'evidence_collected',
    stageName: 'Evidence Collected',
    description: 'Additional evidence collected by admin',
    icon: '📋',
    userVisible: true,
    adminComment: comment,
    createdBy: new ObjectId(adminId),
    createdByRole: 'admin',
    createdAt: new Date(),
    metadata: {
      collectedBy: adminId,
      evidenceType: metadata?.evidenceType || 'admin_collected'
    }
  });

  // Update case status
  await db.collection('cases').updateOne(
    { _id: new ObjectId(caseId) },
    { 
      $set: { 
        status: 'evidence_collected',
        updatedAt: new Date()
      }
    }
  );

  // Log admin action
  await db.collection('admin_actions').insertOne({
    caseId: new ObjectId(caseId),
    action: 'add_evidence',
    comment: comment,
    adminId: new ObjectId(adminId),
    createdAt: new Date(),
    metadata: metadata
  });

  return { stage: 'evidence_collected', status: 'evidence_collected' };
}

// Investigate scammer action
async function investigateScammer(db, caseId, adminId, comment) {
  // Get scammer details
  const caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
  const scammer = await db.collection('scammers').findOne({ 
    cases: { $in: [caseDoc.caseId] } 
  });

  if (scammer) {
    // Update scammer status
    await db.collection('scammers').updateOne(
      { _id: scammer._id },
      { 
        $set: { 
          status: 'under_investigation',
          updatedAt: new Date()
        }
      }
    );
  }

  // Add timeline entry
  await db.collection('case_timeline').insertOne({
    caseId: new ObjectId(caseId),
    stage: 'under_investigation',
    stageName: 'Scammer Under Investigation',
    description: 'Scammer profile is being investigated',
    icon: '🔍',
    userVisible: true,
    adminComment: comment,
    createdBy: new ObjectId(adminId),
    createdByRole: 'admin',
    createdAt: new Date(),
    metadata: {
      investigatedBy: adminId,
      scammerId: scammer?._id
    }
  });

  // Log admin action
  await db.collection('admin_actions').insertOne({
    caseId: new ObjectId(caseId),
    action: 'investigate_scammer',
    comment: comment,
    adminId: new ObjectId(adminId),
    createdAt: new Date()
  });

  return { stage: 'under_investigation', scammerStatus: 'under_investigation' };
}

// Resolve case action
async function resolveCase(db, caseId, adminId, comment) {
  // Add timeline entry
  await db.collection('case_timeline').insertOne({
    caseId: new ObjectId(caseId),
    stage: 'resolved',
    stageName: 'Case Resolved',
    description: 'Fraud case has been successfully resolved',
    icon: '✅',
    userVisible: true,
    adminComment: comment,
    createdBy: new ObjectId(adminId),
    createdByRole: 'admin',
    createdAt: new Date(),
    metadata: {
      resolvedBy: adminId,
      resolutionDate: new Date()
    }
  });

  // Update case status
  await db.collection('cases').updateOne(
    { _id: new ObjectId(caseId) },
    { 
      $set: { 
        status: 'resolved',
        updatedAt: new Date()
      }
    }
  );

  // Log admin action
  await db.collection('admin_actions').insertOne({
    caseId: new ObjectId(caseId),
    action: 'resolve_case',
    comment: comment,
    adminId: new ObjectId(adminId),
    createdAt: new Date()
  });

  return { stage: 'resolved', status: 'resolved' };
}

// Close case action
async function closeCase(db, caseId, adminId, comment) {
  // Add timeline entry
  await db.collection('case_timeline').insertOne({
    caseId: new ObjectId(caseId),
    stage: 'closed',
    stageName: 'Case Closed',
    description: 'Case has been officially closed',
    icon: '🔒',
    userVisible: true,
    adminComment: comment,
    createdBy: new ObjectId(adminId),
    createdByRole: 'admin',
    createdAt: new Date(),
    metadata: {
      closedBy: adminId,
      closureDate: new Date()
    }
  });

  // Update case status
  await db.collection('cases').updateOne(
    { _id: new ObjectId(caseId) },
    { 
      $set: { 
        status: 'closed',
        updatedAt: new Date()
      }
    }
  );

  // Log admin action
  await db.collection('admin_actions').insertOne({
    caseId: new ObjectId(caseId),
    action: 'close_case',
    comment: comment,
    adminId: new ObjectId(adminId),
    createdAt: new Date()
  });

  return { stage: 'closed', status: 'closed' };
}

// Get admin actions for a case
router.get('/:caseId/actions', async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;

    const actions = await db.collection('admin_actions')
      .find({ caseId: new ObjectId(caseId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: actions
    });

  } catch (error) {
    console.error('Get admin actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving admin actions'
    });
  }
});

// Get available actions for a case
router.get('/:caseId/available-actions', async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;

    const caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const availableActions = getAvailableActions(caseDoc.status);

    res.json({
      success: true,
      data: {
        currentStatus: caseDoc.status,
        availableActions
      }
    });

  } catch (error) {
    console.error('Get available actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving available actions'
    });
  }
});

// Helper function to get available actions based on case status
function getAvailableActions(currentStatus) {
  const actionMap = {
    'submitted': [
      { action: 'verify_information', label: 'Verify Information', icon: '🔍' },
      { action: 'reject_case', label: 'Reject Case', icon: '❌' }
    ],
    'verified': [
      { action: 'generate_crpc', label: 'Generate 91 CrPC', icon: '📋' },
      { action: 'investigate_scammer', label: 'Investigate Scammer', icon: '🔍' }
    ],
    'crpc_generated': [
      { action: 'send_emails', label: 'Send to Authorities', icon: '📧' }
    ],
    'emails_sent': [
      { action: 'update_status', label: 'Update Status', icon: '📝' }
    ],
    'under_review': [
      { action: 'add_evidence', label: 'Add Evidence', icon: '📋' },
      { action: 'resolve_case', label: 'Resolve Case', icon: '✅' }
    ],
    'evidence_collected': [
      { action: 'resolve_case', label: 'Resolve Case', icon: '✅' }
    ],
    'resolved': [
      { action: 'close_case', label: 'Close Case', icon: '🔒' }
    ]
  };

  return actionMap[currentStatus] || [];
}

module.exports = router;
