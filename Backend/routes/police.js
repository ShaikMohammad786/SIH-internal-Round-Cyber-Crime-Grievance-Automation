const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const TimelineManager = require('../utils/timelineManager');
const router = express.Router();

// Middleware to check if user is police
const requirePolice = (req, res, next) => {
  if (req.user.role !== 'police') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Police privileges required.'
    });
  }
  next();
};

// Apply authentication middleware to all police routes
router.use(authenticateToken);
router.use(requirePolice);

// Get assigned cases for police
router.get('/cases', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const policeId = req.user.userId;
    
    console.log('Police ID:', policeId);
    
    // Get cases assigned to this police officer
    const cases = await db.collection('cases').find({
      assignedTo: policeId,
      status: { $in: ['emails_sent', 'under_review', 'evidence_collected', 'resolved'] }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log('Found cases for police:', cases.length);
    
    // Get user details for each case
    const casesWithUsers = await Promise.all(cases.map(async (caseItem) => {
      const user = await db.collection('users').findOne({ _id: caseItem.userId });
      return {
        ...caseItem,
        user: user ? { name: user.name, email: user.email } : { name: 'Unknown', email: 'N/A' }
      };
    }));
    
    res.json({
      success: true,
      data: casesWithUsers
    });
  } catch (error) {
    console.error('Get police cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned cases'
    });
  }
});

// Get case details for police
router.get('/cases/:caseId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const policeId = req.user.userId;
    
    // Get case details
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }],
      assignedTo: policeId
    });
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or not assigned to you'
      });
    }
    
    // Get timeline entries
    const timeline = await db.collection('case_timeline').find({
      caseId: new ObjectId(caseId)
    }).sort({ createdAt: 1 }).toArray();
    
    // Get scammer details
    const scammerDetails = await db.collection('scammers').findOne({
      caseId: new ObjectId(caseId)
    });
    
    res.json({
      success: true,
      case: {
        ...caseData,
        timeline: timeline,
        scammerDetails: scammerDetails
      }
    });
  } catch (error) {
    console.error('Get police case details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case details'
    });
  }
});

// Update case status (police actions)
router.put('/cases/:caseId/status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const { status, comment, action } = req.body;
    const policeId = req.user.userId;
    
    // Validate status progression
    const validStatuses = ['under_review', 'evidence_collected', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for police action'
      });
    }
    
    // Get current case
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }],
      assignedTo: policeId
    });
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or not assigned to you'
      });
    }
    
    // Map status to stage
    const statusToStageMap = {
      'under_review': 'under_review',
      'evidence_collected': 'evidence_collected',
      'resolved': 'case_resolved',
      'closed': 'case_closed'
    };
    
    const stage = statusToStageMap[status];
    const stageName = {
      'under_review': 'Under Review',
      'evidence_collected': 'Evidence Collected',
      'case_resolved': 'Case Resolved',
      'case_closed': 'Case Closed'
    }[stage];
    
    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: stage,
      stageName: stageName,
      status: 'completed',
      description: comment || `Case status updated to: ${status}`,
      icon: '👮',
      userVisible: true,
      adminComment: `Police Action: ${action || status}`,
      createdBy: new ObjectId(policeId),
      createdByRole: 'police',
      createdAt: new Date(),
      completedAt: new Date(),
      metadata: {
        policeId: policeId,
        action: action,
        previousStatus: caseData.status,
        newStatus: status
      }
    });
    
    // Update case status
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date(),
          lastUpdatedBy: policeId
        }
      }
    );
    
    // Log police action
    await db.collection('police_actions').insertOne({
      caseId: new ObjectId(caseId),
      action: action || status,
      comment: comment,
      policeId: new ObjectId(policeId),
      createdAt: new Date(),
      metadata: {
        previousStatus: caseData.status,
        newStatus: status
      }
    });
    
    res.json({
      success: true,
      message: 'Case status updated successfully',
      data: {
        stage: stage,
        status: status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update police case status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case status'
    });
  }
});

// Add evidence or arrest details
router.post('/cases/:caseId/evidence', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const { evidenceType, details, arrestInfo, recommendation } = req.body;
    const policeId = req.user.userId;
    
    // Get case
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }],
      assignedTo: policeId
    });
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or not assigned to you'
      });
    }
    
    // Add evidence to case
    const evidenceEntry = {
      type: evidenceType,
      details: details,
      arrestInfo: arrestInfo,
      recommendation: recommendation,
      addedBy: policeId,
      addedAt: new Date()
    };
    
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $push: { 
          policeEvidence: evidenceEntry
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    
    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: 'evidence_collected',
      stageName: 'Evidence Collected',
      status: 'completed',
      description: `Evidence collected: ${evidenceType}. ${arrestInfo ? 'Arrest made.' : ''} ${recommendation ? 'Recommendation: ' + recommendation : ''}`,
      icon: '📋',
      userVisible: true,
      adminComment: `Police Evidence: ${details}`,
      createdBy: new ObjectId(policeId),
      createdByRole: 'police',
      createdAt: new Date(),
      completedAt: new Date(),
      metadata: {
        evidenceType: evidenceType,
        arrestInfo: arrestInfo,
        recommendation: recommendation
      }
    });
    
    res.json({
      success: true,
      message: 'Evidence added successfully',
      data: evidenceEntry
    });
  } catch (error) {
    console.error('Add police evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add evidence'
    });
  }
});

// Get police dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const policeId = req.user.userId;
    
    const [
      totalAssigned,
      underReview,
      evidenceCollected,
      resolved,
      closed
    ] = await Promise.all([
      db.collection('cases').countDocuments({ assignedTo: policeId }),
      db.collection('cases').countDocuments({ assignedTo: policeId, status: 'under_review' }),
      db.collection('cases').countDocuments({ assignedTo: policeId, status: 'evidence_collected' }),
      db.collection('cases').countDocuments({ assignedTo: policeId, status: 'resolved' }),
      db.collection('cases').countDocuments({ assignedTo: policeId, status: 'closed' })
    ]);
    
    res.json({
      success: true,
      data: {
        totalAssigned,
        underReview,
        evidenceCollected,
        resolved,
        closed,
        activeCases: underReview + evidenceCollected
      }
    });
  } catch (error) {
    console.error('Get police dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Collect evidence
router.post('/cases/:caseId/collect-evidence', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const timelineManager = new TimelineManager(db);
    const { caseId } = req.params;
    const { evidence, description, actionTaken } = req.body;

    // Get case details
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }],
      assignedTo: req.user.userId
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or not assigned to you'
      });
    }

    // Prepare evidence data
    const evidenceData = {
      evidence,
      description,
      actionTaken,
      collectedBy: req.user.userId,
      collectedByName: req.user.name || 'Police Officer',
      collectedAt: new Date()
    };

    // Update case with evidence
    await db.collection('cases').updateOne(
      { _id: caseData._id },
      {
        $push: { policeEvidence: evidenceData },
        $set: {
          status: 'evidence_collected',
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await timelineManager.addTimelineEntry(
      caseData._id,
      'evidence_collected',
      'Evidence Collected',
      'completed',
      `Evidence collected and action taken: ${actionTaken || 'Investigation completed'}`,
      { evidence: evidenceData },
      { userId: req.user.userId, role: 'police', name: req.user.name || 'Police Officer' }
    );

    res.json({
      success: true,
      message: 'Evidence collected successfully',
      evidence: evidenceData
    });
  } catch (error) {
    console.error('Collect evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to collect evidence'
    });
  }
});

// Resolve case
router.post('/cases/:caseId/resolve', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const timelineManager = new TimelineManager(db);
    const { caseId } = req.params;
    const { resolutionDetails, actionTaken, outcome } = req.body;

    // Get case details
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }],
      assignedTo: req.user.userId
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or not assigned to you'
      });
    }

    // Prepare resolution data
    const resolutionData = {
      resolutionDetails,
      actionTaken,
      outcome,
      resolvedBy: req.user.userId,
      resolvedByName: req.user.name || 'Police Officer',
      resolvedAt: new Date()
    };

    // Update case with resolution
    await db.collection('cases').updateOne(
      { _id: caseData._id },
      {
        $set: {
          status: 'resolved',
          resolutionDetails: resolutionData,
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await timelineManager.addTimelineEntry(
      caseData._id,
      'case_resolved',
      'Case Resolved',
      'completed',
      `Case resolved: ${outcome || 'Investigation completed with appropriate action'}`,
      { resolution: resolutionData },
      { userId: req.user.userId, role: 'police', name: req.user.name || 'Police Officer' }
    );

    res.json({
      success: true,
      message: 'Case resolved successfully',
      resolution: resolutionData
    });
  } catch (error) {
    console.error('Resolve case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve case'
    });
  }
});

// Close case (admin only, but accessible through police portal)
router.post('/cases/:caseId/close', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const timelineManager = new TimelineManager(db);
    const { caseId } = req.params;
    const { closureReason, finalNotes } = req.body;

    // Get case details
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }],
      assignedTo: req.user.userId
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or not assigned to you'
      });
    }

    // Check if case is resolved
    if (caseData.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Case must be resolved before closing'
      });
    }

    // Prepare closure data
    const closureData = {
      closureReason,
      finalNotes,
      closedBy: req.user.userId,
      closedByName: req.user.name || 'Police Officer',
      closedAt: new Date()
    };

    // Update case with closure
    await db.collection('cases').updateOne(
      { _id: caseData._id },
      {
        $set: {
          status: 'closed',
          closureDetails: closureData,
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await timelineManager.addTimelineEntry(
      caseData._id,
      'case_closed',
      'Case Closed',
      'completed',
      `Case closed: ${closureReason || 'Investigation completed and case closed'}`,
      { closure: closureData },
      { userId: req.user.userId, role: 'police', name: req.user.name || 'Police Officer' }
    );

    res.json({
      success: true,
      message: 'Case closed successfully',
      closure: closureData
    });
  } catch (error) {
    console.error('Close case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close case'
    });
  }
});

module.exports = router;
