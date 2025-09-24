const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get detailed case information
router.get('/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = req.app.locals.db;
    
    console.log("Getting case details for ID:", caseId);

    // Find the case
    let caseDoc;
    try {
      // Try to convert to ObjectId first
      if (ObjectId.isValid(caseId)) {
        caseDoc = await db.collection('cases').findOne({ _id: new ObjectId(caseId) });
      }
      
      // If not found by ObjectId, try by caseId string
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

    // Check if user can access this case (either owner or admin)
    if (req.user.role !== 'admin' && caseDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own cases.'
      });
    }

    // Get user information from both users and userProfiles collections
    const user = await db.collection('users').findOne({ _id: caseDoc.userId });
    const userProfile = await db.collection('userProfiles').findOne({ userId: caseDoc.userId });
    
    // Get case timeline/status history - remove duplicates
    const timeline = await db.collection('case_timeline').find({ 
      caseId: caseDoc._id 
    }).sort({ createdAt: 1 }).toArray();

    // Get evidence files
    const evidence = await db.collection('case_evidence').find({ 
      caseId: caseDoc._id 
    }).toArray();

    // Get admin comments
    const adminComments = await db.collection('admin_comments').find({ 
      caseId: caseDoc._id 
    }).sort({ createdAt: -1 }).toArray();

    // Generate clean timeline without duplicates
    const generateCleanTimeline = (caseDoc) => {
      const baseTimeline = [
        {
          id: '1',
          stage: 'Report Submitted',
          status: 'completed',
          description: 'Initial report received and logged.',
          completedAt: caseDoc.createdAt,
          icon: '📄',
          adminActions: ['verify_details', 'request_more_info']
        },
        {
          id: '2',
          stage: 'Information Verified',
          status: ['verified', 'under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(caseDoc.status) ? 'completed' : 'pending',
          description: 'Personal and contact details verified.',
          completedAt: ['verified', 'under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(caseDoc.status) ? new Date().toISOString() : null,
          icon: '🔍',
          adminActions: ['collect_scammer_details', 'verify_evidence']
        },
        {
          id: '3',
          stage: 'Under Review',
          status: ['under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(caseDoc.status) ? 'completed' : 'pending',
          description: 'Case being reviewed by investigation team.',
          completedAt: ['under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(caseDoc.status) ? new Date().toISOString() : null,
          icon: '🔍',
          adminActions: ['start_investigation', 'collect_evidence']
        },
        {
          id: '4',
          stage: 'Evidence Collected',
          status: ['evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(caseDoc.status) ? 'completed' : 'pending',
          description: 'All relevant evidence gathered.',
          completedAt: ['evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(caseDoc.status) ? new Date().toISOString() : null,
          icon: '📋',
          adminActions: ['send_emails', 'generate_crpc']
        },
        {
          id: '5',
          stage: 'Case Resolved',
          status: ['resolved', 'closed'].includes(caseDoc.status) ? 'completed' : 'pending',
          description: 'Technical analysis and review finished.',
          completedAt: ['resolved', 'closed'].includes(caseDoc.status) ? new Date().toISOString() : null,
          icon: '📊',
          adminActions: ['mark_resolved', 'police_contact']
        },
        {
          id: '6',
          stage: 'Case Closed',
          status: caseDoc.status === 'closed' ? 'completed' : 'pending',
          description: 'Case successfully closed.',
          completedAt: caseDoc.status === 'closed' ? new Date().toISOString() : null,
          icon: '✅',
          adminActions: ['close_case', 'follow_up']
        }
      ];

      // If we have database timeline entries, merge them intelligently
      if (timeline.length > 0) {
        const uniqueStages = new Map();
        
        // Add database entries first (they have actual timestamps)
        timeline.forEach(entry => {
          if (entry.stage && !uniqueStages.has(entry.stage)) {
            uniqueStages.set(entry.stage, {
              id: entry._id.toString(),
              stage: entry.stage,
              status: entry.status,
              description: entry.description,
              completedAt: entry.completedAt,
              icon: entry.icon,
              adminActions: entry.adminActions || []
            });
          }
        });

        // Add base timeline entries for missing stages
        baseTimeline.forEach(baseEntry => {
          if (!uniqueStages.has(baseEntry.stage)) {
            uniqueStages.set(baseEntry.stage, baseEntry);
          }
        });

        return Array.from(uniqueStages.values()).sort((a, b) => {
          const order = ['Report Submitted', 'Information Verified', 'Under Review', 'Evidence Collected', 'Case Resolved', 'Case Closed'];
          return order.indexOf(a.stage) - order.indexOf(b.stage);
        });
      }

      return baseTimeline;
    };

    // Format the response
    const caseData = {
      id: caseDoc._id,
      caseId: caseDoc.caseId,
      caseType: caseDoc.caseType,
      amount: caseDoc.amount,
      status: caseDoc.status,
      priority: caseDoc.priority,
      createdAt: caseDoc.createdAt,
      updatedAt: caseDoc.updatedAt,
      description: caseDoc.description,
      incidentDate: caseDoc.incidentDate,
      location: caseDoc.location,
      contactInfo: caseDoc.contactInfo,
      formData: caseDoc.formData,
      scammerInfo: caseDoc.scammerInfo,
      assignedTo: caseDoc.assignedTo,
      assignedToName: caseDoc.assignedToName,
      assignedAt: caseDoc.assignedAt,
      emailStatus: caseDoc.emailStatus,
      crpcDocumentId: caseDoc.crpcDocumentId,
      flow: caseDoc.flow,
      user: user ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: userProfile?.addressInfo?.streetAddress ? 
          `${userProfile.addressInfo.streetAddress}, ${userProfile.addressInfo.city}, ${userProfile.addressInfo.state} ${userProfile.addressInfo.postalCode}` :
          user.address || 'Address not provided',
        dateOfBirth: userProfile?.personalInfo?.dateOfBirth || 
          user.dateOfBirth || 'Date of birth not provided'
      } : null,
      evidence: evidence.map(ev => ({
        id: ev._id,
        name: ev.fileName,
        type: ev.fileType,
        size: ev.fileSize,
        url: ev.fileUrl,
        uploadedAt: ev.uploadedAt
      })),
      timeline: generateCleanTimeline(caseDoc),
      adminComments: adminComments.map(comment => ({
        id: comment._id,
        comment: comment.comment,
        adminName: comment.adminName,
        createdAt: comment.createdAt
      }))
    };

    res.json({
      success: true,
      data: caseData
    });

  } catch (error) {
    console.error('Get case details error:', error);
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Handle invalid ObjectId errors
    if (error.name === 'BSONTypeError' || error.message?.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving case details. Please try again later.'
    });
  }
});

// Update case status
router.put('/:caseId/status', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status, adminComment } = req.body;
    const db = req.app.locals.db;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Update case status
    const result = await db.collection('cases').updateOne(
      { 
        $or: [
          { _id: new ObjectId(caseId) },
          { caseId: caseId }
        ]
      },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Add timeline entry for status change
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: getStageFromStatus(status),
      status: 'completed',
      description: getDescriptionFromStatus(status),
      completedAt: new Date().toISOString(),
      icon: getIconFromStatus(status),
      createdAt: new Date(),
      adminAction: true,
      adminName: req.user?.name || 'Admin'
    });

    // Update other timeline stages based on new status
    await updateTimelineStages(db, caseId, status);

    // Add admin comment if provided
    if (adminComment) {
      await db.collection('admin_comments').insertOne({
        caseId: new ObjectId(caseId),
        comment: adminComment,
        adminName: req.user?.name || 'Admin',
        createdAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Case status updated successfully'
    });

  } catch (error) {
    console.error('Update case status error:', error);
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Handle invalid ObjectId errors
    if (error.name === 'BSONTypeError' || error.message?.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating case status. Please try again later.'
    });
  }
});

// Add admin comment
router.post('/:caseId/comment', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { comment } = req.body;
    const db = req.app.locals.db;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    await db.collection('admin_comments').insertOne({
      caseId: new ObjectId(caseId),
      comment: comment,
      adminName: req.user?.name || 'Admin',
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Add comment error:', error);
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Handle invalid ObjectId errors
    if (error.name === 'BSONTypeError' || error.message?.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment. Please try again later.'
    });
  }
});

// Admin stage action
router.post('/:caseId/stage-action', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { action, stage, comment } = req.body;
    const db = req.app.locals.db;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Map actions to status updates based on new timeline system
    const actionStatusMap = {
      'verify_details': 'information_verified',
      'collect_scammer_details': 'information_verified',
      'verify_evidence': 'information_verified',
      'generate_crpc': 'crpc_generated',
      'send_emails': 'emails_sent',
      'assign_police': 'under_review',
      'start_investigation': 'under_review',
      'collect_evidence': 'evidence_collected',
      'mark_resolved': 'resolved',
      'police_contact': 'resolved',
      'close_case': 'closed',
      'request_more_info': 'submitted', // Keep as submitted for more info requests
      'follow_up': 'closed', // Follow up actions
      // Additional action mappings for any legacy actions
      'start_analysis': 'under_review',
      'escalate_verification': 'information_verified',
      'initiate_crpc': 'crpc_generated',
      'request_additional_evidence': 'under_review',
      'mark_analysis_complete': 'evidence_collected',
      'send_legal_notice': 'evidence_collected',
      'track_response': 'resolved',
      'escalate_legal': 'resolved'
    };

    const newStatus = actionStatusMap[action];
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    // Update case status
    await db.collection('cases').updateOne(
      { 
        $or: [
          { _id: new ObjectId(caseId) },
          { caseId: caseId }
        ]
      },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: stage,
      status: 'completed',
      description: getDescriptionFromStatus(newStatus),
      completedAt: new Date().toISOString(),
      icon: getIconFromStatus(newStatus),
      createdAt: new Date(),
      adminAction: true,
      adminName: req.user?.name || 'Admin',
      action: action
    });

    // Update timeline stages
    await updateTimelineStages(db, caseId, newStatus);

    // Add comment if provided
    if (comment) {
      await db.collection('admin_comments').insertOne({
        caseId: new ObjectId(caseId),
        comment: comment,
        adminName: req.user?.name || 'Admin',
        createdAt: new Date(),
        action: action,
        stage: stage
      });
    }

    res.json({
      success: true,
      message: 'Stage action completed successfully'
    });

  } catch (error) {
    console.error('Stage action error:', error);
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Handle invalid ObjectId errors
    if (error.name === 'BSONTypeError' || error.message?.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while performing stage action. Please try again later.'
    });
  }
});

// Helper function to update timeline stages based on status
async function updateTimelineStages(db, caseId, newStatus) {
  const caseObjectId = new ObjectId(caseId);
  
  // Define the 6-stage professional timeline system
  const timelineStages = [
    {
      stage: 'Report Submitted',
      status: 'completed',
      description: 'Initial report received and logged.',
      icon: '📄',
      completedAt: new Date().toISOString(),
      adminActions: ['verify_details', 'request_more_info']
    },
    {
      stage: 'Information Verified',
      status: ['verified', 'under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(newStatus) ? 'completed' : 'pending',
      description: 'Personal and contact details verified.',
      icon: '🔍',
      completedAt: ['verified', 'under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(newStatus) ? new Date().toISOString() : null,
      adminActions: ['collect_scammer_details', 'verify_evidence']
    },
    {
      stage: 'Under Review',
      status: ['under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(newStatus) ? 'completed' : 'pending',
      description: 'Case being reviewed by investigation team.',
      icon: '🔍',
      completedAt: ['under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(newStatus) ? new Date().toISOString() : null,
      adminActions: ['start_investigation', 'collect_evidence']
    },
    {
      stage: 'Evidence Collected',
      status: ['evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(newStatus) ? 'completed' : 'pending',
      description: 'All relevant evidence gathered.',
      icon: '📋',
      completedAt: ['evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(newStatus) ? new Date().toISOString() : null,
      adminActions: ['send_emails', 'generate_crpc']
    },
    {
      stage: 'Case Resolved',
      status: ['resolved', 'closed'].includes(newStatus) ? 'completed' : 'pending',
      description: 'Technical analysis and review finished.',
      icon: '📊',
      completedAt: ['resolved', 'closed'].includes(newStatus) ? new Date().toISOString() : null,
      adminActions: ['mark_resolved', 'police_contact']
    },
    {
      stage: 'Case Closed',
      status: newStatus === 'closed' ? 'completed' : 'pending',
      description: 'Case successfully closed.',
      icon: '✅',
      completedAt: newStatus === 'closed' ? new Date().toISOString() : null,
      adminActions: ['close_case', 'follow_up']
    }
  ];

  // Update or insert each timeline stage
  for (const stage of timelineStages) {
    await db.collection('case_timeline').updateOne(
      { 
        caseId: caseObjectId,
        stage: stage.stage
      },
      { 
        $set: {
          ...stage,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }
}

// Helper functions
function getStageFromStatus(status) {
  const statusMap = {
    'submitted': 'Report Submitted',
    'verified': 'Information Verified',
    'under_review': 'Under Review',
    'evidence_collected': 'Evidence Collected',
    'crpc_generated': 'Evidence Collected',
    'resolved': 'Case Resolved',
    'closed': 'Case Closed'
  };
  return statusMap[status] || 'Report Submitted';
}

function getDescriptionFromStatus(status) {
  const descMap = {
    'submitted': 'Initial report received and logged.',
    'verified': 'Personal and contact details verified.',
    'under_review': 'Case being reviewed by investigation team.',
    'evidence_collected': 'All relevant evidence gathered.',
    'crpc_generated': '91 CrPC document generated and sent.',
    'resolved': 'Technical analysis and review finished.',
    'closed': 'Case successfully closed.'
  };
  return descMap[status] || 'Status updated.';
}

function getIconFromStatus(status) {
  const iconMap = {
    'submitted': '📄',
    'verified': '🔍',
    'under_review': '🔍',
    'evidence_collected': '📋',
    'crpc_generated': '📋',
    'resolved': '📊',
    'closed': '✅'
  };
  return iconMap[status] || '📄';
}

module.exports = router;