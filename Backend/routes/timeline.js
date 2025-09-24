const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Timeline stages configuration
const TIMELINE_STAGES = {
  REPORT_SUBMITTED: {
    id: 'report_submitted',
    name: 'Report Submitted',
    description: 'Initial fraud report received and logged',
    icon: '📄',
    userVisible: true,
    adminActions: ['verify_details', 'request_more_info'],
    nextStages: ['information_verified', 'rejected']
  },
  INFORMATION_VERIFIED: {
    id: 'information_verified',
    name: 'Information Verified',
    description: 'User details and scammer information verified',
    icon: '🔍',
    userVisible: true,
    adminActions: ['generate_crpc', 'investigate_scammer'],
    nextStages: ['crpc_generated', 'under_investigation']
  },
  CRPC_GENERATED: {
    id: 'crpc_generated',
    name: '91 CrPC Generated',
    description: 'Legal document generated and sent to authorities',
    icon: '📋',
    userVisible: true,
    adminActions: ['send_emails', 'track_responses'],
    nextStages: ['emails_sent', 'under_investigation']
  },
  EMAILS_SENT: {
    id: 'emails_sent',
    name: 'Authorities Notified',
    description: 'Emails sent to telecom, banking, and nodal authorities',
    icon: '📧',
    userVisible: true,
    adminActions: ['track_responses', 'follow_up'],
    nextStages: ['under_investigation', 'authority_response']
  },
  UNDER_INVESTIGATION: {
    id: 'under_investigation',
    name: 'Under Investigation',
    description: 'Case is being investigated by authorities',
    icon: '🔍',
    userVisible: true,
    adminActions: ['update_status', 'add_evidence'],
    nextStages: ['evidence_collected', 'resolved', 'closed']
  },
  EVIDENCE_COLLECTED: {
    id: 'evidence_collected',
    name: 'Evidence Collected',
    description: 'Sufficient evidence collected for legal action',
    icon: '📋',
    userVisible: true,
    adminActions: ['prepare_charges', 'court_filing'],
    nextStages: ['resolved', 'court_filed']
  },
  RESOLVED: {
    id: 'resolved',
    name: 'Case Resolved',
    description: 'Fraud case has been successfully resolved',
    icon: '✅',
    userVisible: true,
    adminActions: ['close_case', 'update_scammer_status'],
    nextStages: ['closed']
  },
  CLOSED: {
    id: 'closed',
    name: 'Case Closed',
    description: 'Case has been officially closed',
    icon: '🔒',
    userVisible: true,
    adminActions: ['archive_case'],
    nextStages: []
  },
  REJECTED: {
    id: 'rejected',
    name: 'Case Rejected',
    description: 'Case was rejected due to insufficient information',
    icon: '❌',
    userVisible: true,
    adminActions: ['request_more_info'],
    nextStages: ['report_submitted']
  }
};

// Add timeline entry
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { caseId, stage, description, adminComment, metadata } = req.body;
    const db = req.app.locals.db;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate stage
    if (!TIMELINE_STAGES[stage]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timeline stage'
      });
    }

    const stageConfig = TIMELINE_STAGES[stage];
    const now = new Date();

    // Check if timeline entry already exists for this stage
    const existingEntry = await db.collection('case_timeline').findOne({
      caseId: new ObjectId(caseId),
      stage: stageConfig.id
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Timeline entry for this stage already exists'
      });
    }

    // Create timeline entry
    const timelineEntry = {
      caseId: new ObjectId(caseId),
      stage: stageConfig.id,
      stageName: stageConfig.name,
      description: description || stageConfig.description,
      icon: stageConfig.icon,
      userVisible: stageConfig.userVisible,
      adminComment: adminComment || null,
      metadata: metadata || {},
      createdBy: new ObjectId(userId),
      createdByRole: userRole,
      createdAt: now,
      updatedAt: now
    };

    // Insert timeline entry
    const result = await db.collection('case_timeline').insertOne(timelineEntry);

    // Update case status based on stage
    await updateCaseStatus(db, caseId, stage, userRole);

    // If this is an admin action, add to admin actions log
    if (userRole === 'admin') {
      await logAdminAction(db, caseId, stage, adminComment, userId);
    }

    // If emails are being sent, trigger email automation
    if (stage === 'EMAILS_SENT') {
      await triggerEmailAutomation(db, caseId);
    }

    res.json({
      success: true,
      message: 'Timeline entry added successfully',
      data: {
        timelineId: result.insertedId,
        stage: stageConfig.id,
        stageName: stageConfig.name,
        createdAt: now
      }
    });

  } catch (error) {
    console.error('Add timeline entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding timeline entry'
    });
  }
});

// Get timeline for a case
router.get('/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log("Timeline request for caseId:", caseId, "userId:", userId, "role:", userRole);

    // Try to find case by ObjectId first, then by caseId string
    let caseDoc;
    try {
      if (ObjectId.isValid(caseId)) {
        caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
      }
      
      if (!caseDoc) {
        caseDoc = await db.collection('cases').findOne({ caseId: caseId });
      }
    } catch (error) {
      console.error("Error finding case:", error);
      caseDoc = null;
    }
    
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check access permissions
    if (userRole !== 'admin' && caseDoc.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get timeline entries
    const timeline = await db.collection('case_timeline')
      .find({ caseId: caseDoc._id })
      .sort({ createdAt: 1 })
      .toArray();

    // Get admin actions for this case
    const adminActions = await db.collection('admin_actions')
      .find({ caseId: caseDoc._id })
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Timeline entries found:", timeline.length);

    res.json({
      success: true,
      data: {
        timeline,
        adminActions,
        currentStage: caseDoc.status,
        nextPossibleStages: getNextPossibleStages(caseDoc.status)
      }
    });

  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving timeline'
    });
  }
});

// Update case status based on timeline stage
async function updateCaseStatus(db, caseId, stage, userRole) {
  const statusMap = {
    'REPORT_SUBMITTED': 'submitted',
    'INFORMATION_VERIFIED': 'verified',
    'CRPC_GENERATED': 'crpc_generated',
    'EMAILS_SENT': 'emails_sent',
    'UNDER_INVESTIGATION': 'under_review',
    'EVIDENCE_COLLECTED': 'evidence_collected',
    'RESOLVED': 'resolved',
    'CLOSED': 'closed',
    'REJECTED': 'rejected'
  };

  const newStatus = statusMap[stage];
  if (newStatus) {
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $set: { 
          status: newStatus,
          updatedAt: new Date()
        }
      }
    );
  }
}

// Log admin action
async function logAdminAction(db, caseId, stage, comment, adminId) {
  const adminAction = {
    caseId: new ObjectId(caseId),
    action: stage,
    comment: comment,
    adminId: new ObjectId(adminId),
    createdAt: new Date()
  };

  await db.collection('admin_actions').insertOne(adminAction);
}

// Trigger email automation
async function triggerEmailAutomation(db, caseId) {
  try {
    // Get case details
    const caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
    if (!caseDoc) return;

    // Get scammer details
    const scammer = await db.collection('scammers').findOne({ 
      cases: { $in: [caseId] } 
    });

    // Get user details
    const user = await db.collection('users').findOne({ _id: caseDoc.userId });
    const userProfile = await db.collection('userProfiles').findOne({ userId: caseDoc.userId });

    // Send emails to authorities
    await sendEmailsToAuthorities(db, caseDoc, scammer, user, userProfile);

    // Update timeline with email status
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: 'emails_sent',
      stageName: 'Authorities Notified',
      description: 'Automated emails sent to telecom, banking, and nodal authorities',
      icon: '📧',
      userVisible: true,
      createdAt: new Date(),
      metadata: {
        emailsSent: ['telecom', 'banking', 'nodal'],
        automated: true
      }
    });

  } catch (error) {
    console.error('Email automation error:', error);
  }
}

// Send emails to authorities
async function sendEmailsToAuthorities(db, caseDoc, scammer, user, userProfile) {
  // This will be implemented in the email automation system
  console.log('Sending emails to authorities for case:', caseDoc.caseId);
  
  // For now, just log the action
  await db.collection('email_logs').insertOne({
    caseId: caseDoc._id,
    emailsSent: ['telecom@fraud.gov.in', 'banking@fraud.gov.in', 'nodal@fraud.gov.in'],
    status: 'sent',
    createdAt: new Date()
  });
}

// Get next possible stages for current status
function getNextPossibleStages(currentStatus) {
  const statusToStageMap = {
    'submitted': ['INFORMATION_VERIFIED', 'REJECTED'],
    'verified': ['CRPC_GENERATED', 'UNDER_INVESTIGATION'],
    'crpc_generated': ['EMAILS_SENT'],
    'emails_sent': ['UNDER_INVESTIGATION'],
    'under_review': ['EVIDENCE_COLLECTED', 'RESOLVED'],
    'evidence_collected': ['RESOLVED'],
    'resolved': ['CLOSED'],
    'rejected': ['REPORT_SUBMITTED']
  };

  const possibleStages = statusToStageMap[currentStatus] || [];
  return possibleStages.map(stage => TIMELINE_STAGES[stage]);
}

// Get timeline stages configuration
router.get('/stages/config', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: TIMELINE_STAGES
    });
  } catch (error) {
    console.error('Get timeline config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving timeline configuration'
    });
  }
});

module.exports = router;
