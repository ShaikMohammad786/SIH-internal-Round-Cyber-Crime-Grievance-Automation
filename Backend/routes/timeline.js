const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const { sendEmailsToAuthorities: sendRealEmails } = require('../services/emailService');
const router = express.Router();

// Timeline stages configuration
const TIMELINE_STAGES = {
  REPORT_SUBMITTED: {
    id: 'submitted',
    name: 'Report Submitted',
    description: 'Initial fraud report received and logged',
    icon: '📄',
    userVisible: true,
    adminActions: ['verify_details'],
    nextStages: ['verified', 'rejected']
  },
  INFORMATION_VERIFIED: {
    id: 'verified',
    name: 'Information Verified',
    description: 'User details and scammer information verified',
    icon: '🔍',
    userVisible: true,
    adminActions: ['generate_crpc'],
    nextStages: ['crpc_generated']
  },
  CRPC_GENERATED: {
    id: 'crpc_generated',
    name: '91 CrPC Generated',
    description: 'Legal document generated under Section 91 of CrPC',
    icon: '📜',
    userVisible: true,
    adminActions: ['send_emails'],
    nextStages: ['emails_sent']
  },
  EMAILS_SENT: {
    id: 'emails_sent',
    name: 'Authorities Notified',
    description: 'Emails sent to telecom, banking, and nodal authorities',
    icon: '📧',
    userVisible: true,
    adminActions: ['authorize_case'],
    nextStages: ['authorized']
  },
  AUTHORIZED: {
    id: 'authorized',
    name: 'Case Authorized',
    description: 'Case authorized by administration and ready for police investigation',
    icon: '✅',
    userVisible: true,
    adminActions: ['assign_police'],
    nextStages: ['assigned_to_police']
  },
  ASSIGNED_TO_POLICE: {
    id: 'assigned_to_police',
    name: 'Assigned to Police',
    description: 'Case assigned to a police officer for field investigation',
    icon: '👮',
    userVisible: true,
    adminActions: ['start_investigation'],
    nextStages: ['under_investigation']
  },
  UNDER_INVESTIGATION: {
    id: 'under_review',
    name: 'Under Investigation',
    description: 'Case is actively being investigated by the assigned officer',
    icon: '🔍',
    userVisible: true,
    adminActions: ['collect_evidence', 'update_status'],
    nextStages: ['evidence_collected']
  },
  EVIDENCE_COLLECTED: {
    id: 'evidence_collected',
    name: 'Evidence Collected',
    description: 'Sufficient evidence collected and verified',
    icon: '📋',
    userVisible: true,
    adminActions: ['mark_resolved'],
    nextStages: ['resolved']
  },
  RESOLVED: {
    id: 'resolved',
    name: 'Case Resolved',
    description: 'Investigation successfully completed and case resolved',
    icon: '✅',
    userVisible: true,
    adminActions: ['close_case'],
    nextStages: ['closed']
  },
  CLOSED: {
    id: 'closed',
    name: 'Case Closed',
    description: 'Case has been officially closed and archived',
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
    nextStages: ['submitted']
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
      cases: { $in: [caseDoc.caseId] }
    });

    // Send emails to authorities using the real service
    const emailResults = await sendRealEmails(caseDoc, scammer, {
      telecom: true,
      banking: true,
      nodal: true
    });

    // Log emails to sent_emails collection for the Communications tab
    for (const [type, result] of Object.entries(emailResults)) {
      try {
        await db.collection('sent_emails').insertOne({
          caseId: new ObjectId(caseDoc._id),
          scammerId: scammer?._id ? new ObjectId(scammer._id) : null,
          emailType: type,
          subject: result.subject || 'No Subject',
          content: result.content || 'No Content',
          sentAt: new Date(),
          sentBy: 'System (Automated)',
          status: result.success ? 'sent' : 'failed',
          recipient: {
            email: result.email,
            department: type
          },
          error: result.error
        });
      } catch (logError) {
        console.error(`❌ Failed to log automated email:`, logError);
      }
    }

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
        emailsSentCount: Object.values(emailResults).filter(r => r.success).length,
        automated: true,
        emailResults: emailResults
      }
    });

  } catch (error) {
    console.error('Email automation error:', error);
  }
}

// Note: sendEmailsToAuthorities stub was replaced by triggerEmailAutomation using the real service directly.

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
