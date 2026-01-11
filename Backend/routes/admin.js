const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const TimelineManager = require('../utils/timelineManager');
const ScammerManager = require('../utils/scammerManager');
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

// Get dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Get comprehensive statistics
    const [
      totalUsers,
      totalCases,
      activeCases,
      resolvedCases,
      totalAmount,
      recentCases,
      caseStatusStats,
      monthlyStats
    ] = await Promise.all([
      // Total users
      db.collection('users').countDocuments(),

      // Total cases
      db.collection('cases').countDocuments(),

      // Active cases (not closed/resolved)
      db.collection('cases').countDocuments({
        status: { $nin: ['closed', 'resolved'] }
      }),

      // Resolved cases
      db.collection('cases').countDocuments({
        status: { $in: ['resolved', 'closed'] }
      }),

      // Total amount
      db.collection('cases').aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray(),

      // Recent cases (last 10)
      db.collection('cases').aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            caseId: 1,
            caseType: 1,
            description: 1,
            amount: 1,
            status: 1,
            priority: 1,
            createdAt: 1,
            assignedTo: 1,
            'user.name': 1,
            'user.email': 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 10 }
      ]).toArray(),

      // Case status breakdown
      db.collection('cases').aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),

      // Monthly statistics (last 6 months)
      db.collection('cases').aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]).toArray()
    ]);

    res.json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalCases,
          activeCases,
          resolvedCases,
          totalAmount: totalAmount[0]?.total || 0
        },
        caseStatusBreakdown: caseStatusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentCases: recentCases.map(caseDoc => {
          // Determine the correct status based on case data
          let displayStatus = caseDoc.status;
          let statusLabel = caseDoc.status;

          // Map database status to user-friendly labels
          const statusMap = {
            'submitted': 'Report Submitted',
            'information_verified': 'Information Verified',
            'crpc_generated': '91 CrPC Generated',
            'emails_sent': 'Authorities Notified',
            'under_review': 'Under Review',
            'evidence_collected': 'Evidence Collected',
            'resolved': 'Case Resolved',
            'closed': 'Case Closed'
          };

          statusLabel = statusMap[caseDoc.status] || caseDoc.status;

          return {
            id: caseDoc._id,
            caseId: caseDoc.caseId,
            caseType: caseDoc.caseType,
            description: caseDoc.description,
            amount: caseDoc.amount,
            status: displayStatus,
            statusLabel: statusLabel,
            priority: caseDoc.priority,
            createdAt: caseDoc.createdAt,
            assignedTo: caseDoc.assignedTo,
            user: caseDoc.user[0]
          };
        }),
        monthlyStats: monthlyStats.map(stat => ({
          month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
          count: stat.count,
          totalAmount: stat.totalAmount
        }))
      }
    });

  } catch (error) {
    console.error('Get admin dashboard stats error:', error);

    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    // Handle aggregation errors
    if (error.name === 'MongoServerError' && error.code === 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while retrieving dashboard statistics. Please try again later.'
    });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 20, search } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await db.collection('users').find(query, {
      projection: { password: 0 }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count
    const totalUsers = await db.collection('users').countDocuments(query);

    // Get case count for each user
    const usersWithCaseCount = await Promise.all(
      users.map(async (user) => {
        const caseCount = await db.collection('cases').countDocuments({
          userId: user._id
        });
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          caseCount
        };
      })
    );

    res.json({
      success: true,
      users: usersWithCaseCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasNext: skip + parseInt(limit) < totalUsers,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user role
router.patch('/users/:userId/role', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get case details for admin
router.get('/cases/:caseId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;

    // Validate caseId format
    let matchQuery;
    if (ObjectId.isValid(caseId)) {
      matchQuery = {
        $or: [
          { _id: new ObjectId(caseId) },
          { caseId: caseId }
        ]
      };
    } else {
      matchQuery = { caseId: caseId };
    }

    const caseDoc = await db.collection('cases').aggregate([
      {
        $match: matchQuery
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'userProfiles',
          localField: 'userId',
          foreignField: 'userId',
          as: 'userProfile'
        }
      },
      {
        $lookup: {
          from: 'scammers',
          localField: 'scammerId',
          foreignField: '_id',
          as: 'scammerDetails'
        }
      }
    ]).toArray();

    if (!caseDoc.length) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const caseData = caseDoc[0];
    const userProfile = caseData.userProfile?.[0];

    // Extract form data structure first
    const formData = caseData.formData || {};
    const actualFormData = formData.formData || formData; // Handle nested structure

    // Get timeline for this case
    const timeline = await db.collection('case_timeline').find({
      caseId: caseData._id
    }).sort({ createdAt: 1 }).toArray();

    // Get evidence files from either the main evidence array or form data fallback
    const rawEvidence = caseData.evidence || actualFormData.evidenceInfo?.evidenceFiles || [];

    // Convert evidence files to the expected format
    const evidence = rawEvidence.map((file, index) => ({
      _id: file._id || `evidence_${index}`,
      name: file.name || file.fileName || `evidence_${index}`,
      type: file.type || file.fileType || 'unknown',
      size: file.size || file.fileSize || 0,
      uploadedAt: file.uploadedAt || new Date(),
      url: file.url || file.data || file.fileUrl || null
    }));

    // Get admin comments
    const adminComments = await db.collection('admin_comments').find({
      caseId: caseData._id
    }).sort({ createdAt: -1 }).toArray();

    // Extract victim details from form data first, then fallback to user data
    const personalInfo = actualFormData.personalInfo || {};
    const contactInfo = actualFormData.contactInfo || {};
    const addressInfo = actualFormData.addressInfo || {};
    const governmentIds = actualFormData.governmentIds || {};

    // DEBUG: Log the form data structure
    console.log('=== VICTIM DETAILS DEBUG ===');
    console.log('Case ID:', caseData.caseId);
    console.log('Form Data:', JSON.stringify(formData, null, 2));
    console.log('Actual Form Data:', JSON.stringify(actualFormData, null, 2));
    console.log('Personal Info:', JSON.stringify(personalInfo, null, 2));
    console.log('Contact Info:', JSON.stringify(contactInfo, null, 2));
    console.log('Address Info:', JSON.stringify(addressInfo, null, 2));
    console.log('Government IDs:', JSON.stringify(governmentIds, null, 2));
    console.log('User Data:', JSON.stringify(caseData.user[0], null, 2));
    console.log('===========================');

    // Get address details from the correct structure
    const currentAddress = addressInfo.currentAddress || {};

    const victimDetails = {
      name: (personalInfo.firstName && personalInfo.lastName) ?
        `${personalInfo.firstName} ${personalInfo.middleName || ''} ${personalInfo.lastName}`.trim() :
        caseData.user[0]?.name || 'Unknown',
      email: contactInfo.email || caseData.user[0]?.email || 'Not provided',
      phone: contactInfo.phone || caseData.user[0]?.phone || 'Not provided',
      alternatePhone: contactInfo.alternatePhone || 'Not provided',
      address: (currentAddress.street && currentAddress.street.trim()) ?
        `${currentAddress.street}, ${currentAddress.city}, ${currentAddress.state} ${currentAddress.postalCode}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') :
        caseData.user[0]?.address || 'Address not provided',
      dateOfBirth: (personalInfo.dateOfBirth && personalInfo.dateOfBirth.trim()) ||
        caseData.user[0]?.dateOfBirth || 'Date of birth not provided',
      gender: (personalInfo.gender && personalInfo.gender.trim()) || 'Not provided',
      nationality: (personalInfo.nationality && personalInfo.nationality.trim()) || 'Not provided',
      aadhaarNumber: (governmentIds.aadhaarNumber && governmentIds.aadhaarNumber.trim()) || 'Not provided',
      panNumber: (governmentIds.panNumber && governmentIds.panNumber.trim()) || 'Not provided',
      otherGovernmentIds: (governmentIds.otherIds && governmentIds.otherIds.length > 0) ? governmentIds.otherIds.join(', ') : 'Not provided',
      emergencyContact: (contactInfo.emergencyContact && contactInfo.emergencyContact.name && contactInfo.emergencyContact.name.trim()) ? {
        name: contactInfo.emergencyContact.name || 'Not provided',
        phone: contactInfo.emergencyContact.phone || 'Not provided',
        relation: contactInfo.emergencyContact.relation || 'Not provided'
      } : null
    };

    // DEBUG: Log the final victim details
    console.log('Final Victim Details:', JSON.stringify(victimDetails, null, 2));

    // Extract scammer details
    const scammerInfo = caseData.scammerDetails?.[0] || null;

    res.json({
      success: true,
      case: {
        id: caseData._id,
        caseId: caseData.caseId,
        caseType: caseData.caseType,
        description: caseData.description,
        amount: caseData.amount,
        incidentDate: caseData.incidentDate,
        location: caseData.location,
        contactInfo: caseData.contactInfo,
        evidence: evidence.map(ev => ({
          id: ev.id || ev._id,
          name: ev.name,
          type: ev.type,
          size: ev.size,
          url: ev.url,
          uploadedAt: ev.uploadedAt
        })),
        status: caseData.status,
        priority: caseData.priority,
        assignedTo: caseData.assignedTo,
        createdAt: caseData.createdAt,
        updatedAt: caseData.updatedAt,
        emailStatus: caseData.emailStatus || {},
        timeline: (() => {
          // Get email status from case data
          const emailStatus = caseData.emailStatus || {};

          // Define the correct timeline order
          const timelineOrder = [
            'report_submitted',
            'information_verified',
            'crpc_generated',
            'emails_sent',
            'under_review',
            'evidence_collected',
            'case_resolved',
            'case_closed'
          ];

          // Generate clean timeline with proper ordering
          const baseTimeline = [
            {
              id: '1',
              stage: 'report_submitted',
              stageName: 'Report Submitted',
              status: 'completed', // Always completed when case exists
              description: 'Initial fraud report received and logged. Case ID: ' + caseData.caseId,
              completedAt: caseData.createdAt,
              icon: '📄',
              adminActions: ['verify_details', 'request_more_info']
            },
            {
              id: '2',
              stage: 'information_verified',
              stageName: 'Information Verified',
              status: caseData.scammerDetails && caseData.scammerDetails.length > 0 ? 'completed' : 'pending',
              description: 'Personal and contact details verified.',
              completedAt: caseData.scammerDetails && caseData.scammerDetails.length > 0 ? new Date().toISOString() : null,
              icon: '🔍',
              adminActions: ['collect_scammer_details', 'verify_evidence']
            },
            {
              id: '3',
              stage: 'crpc_generated',
              stageName: '91 CrPC Generated',
              status: caseData.crpcDocumentId ? 'completed' : 'pending',
              description: 'Legal document generated under Section 91 of CrPC',
              completedAt: caseData.crpcDocumentId ? new Date().toISOString() : null,
              icon: '⚖️',
              adminActions: ['download_crpc', 'send_emails']
            },
            {
              id: '4',
              stage: 'emails_sent',
              stageName: 'Authorities Notified',
              status: caseData.emailStatus && caseData.emailStatus.lastSent ? 'completed' : 'pending',
              description: '91 CrPC document sent to relevant authorities',
              completedAt: caseData.emailStatus && caseData.emailStatus.lastSent ? new Date().toISOString() : null,
              icon: '📧',
              adminActions: ['track_responses', 'follow_up'],
              emailStatus: {
                telecom: emailStatus.results?.telecom?.status === 'sent' ? 'sent' : 'pending',
                banking: emailStatus.results?.banking?.status === 'sent' ? 'sent' : 'pending',
                nodal: emailStatus.results?.nodal?.status === 'sent' ? 'sent' : 'pending'
              }
            },
            {
              id: '5',
              stage: 'under_review',
              stageName: 'Under Review',
              status: caseData.assignedTo ? 'completed' : 'pending',
              description: 'Police taking action on the case.',
              completedAt: caseData.assignedTo ? new Date().toISOString() : null,
              icon: '👮',
              adminActions: ['assign_police']
            },
            {
              id: '6',
              stage: 'evidence_collected',
              stageName: 'Evidence Collected',
              status: caseData.policeEvidence && caseData.policeEvidence.length > 0 ? 'completed' : 'pending',
              description: 'Evidence collected and emails sent to: telecom, bank, nodal',
              completedAt: caseData.policeEvidence && caseData.policeEvidence.length > 0 ? new Date().toISOString() : null,
              icon: '📋',
              adminActions: ['mark_resolved', 'police_contact']
            },
            {
              id: '7',
              stage: 'case_resolved',
              stageName: 'Case Resolved',
              status: caseData.status === 'resolved' || caseData.status === 'closed' ? 'completed' : 'pending',
              description: 'Technical analysis and review finished.',
              completedAt: caseData.status === 'resolved' || caseData.status === 'closed' ? new Date().toISOString() : null,
              icon: '📊',
              adminActions: ['mark_resolved', 'police_contact']
            },
            {
              id: '8',
              stage: 'case_closed',
              stageName: 'Case Closed',
              status: caseData.status === 'closed' ? 'completed' : 'pending',
              description: 'Case successfully closed.',
              completedAt: caseData.status === 'closed' ? new Date().toISOString() : null,
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
                  stageName: entry.stageName || entry.stage,
                  status: entry.status,
                  description: entry.description,
                  completedAt: entry.completedAt,
                  icon: entry.icon,
                  adminActions: entry.adminActions || [],
                  emailStatus: entry.emailStatus || {}
                });
              }
            });

            // Add base timeline entries for missing stages with proper status
            baseTimeline.forEach(baseEntry => {
              if (!uniqueStages.has(baseEntry.stage)) {
                // Update status based on actual case data
                let status = baseEntry.status;
                if (baseEntry.stage === 'information_verified') {
                  status = caseData.scammerDetails && caseData.scammerDetails.length > 0 ? 'completed' : 'pending';
                } else if (baseEntry.stage === 'crpc_generated') {
                  status = caseData.crpcDocumentId ? 'completed' : 'pending';
                } else if (baseEntry.stage === 'emails_sent') {
                  status = caseData.emailStatus && caseData.emailStatus.lastSent ? 'completed' : 'pending';
                } else if (baseEntry.stage === 'under_review') {
                  status = caseData.assignedTo ? 'completed' : 'pending';
                } else if (baseEntry.stage === 'evidence_collected') {
                  status = caseData.policeEvidence && caseData.policeEvidence.length > 0 ? 'completed' : 'pending';
                } else if (baseEntry.stage === 'case_resolved') {
                  status = caseData.status === 'resolved' || caseData.status === 'closed' ? 'completed' : 'pending';
                } else if (baseEntry.stage === 'case_closed') {
                  status = caseData.status === 'closed' ? 'completed' : 'pending';
                }

                uniqueStages.set(baseEntry.stage, {
                  ...baseEntry,
                  status: status
                });
              }
            });

            // Return timeline in correct order
            return timelineOrder.map(stage => uniqueStages.get(stage)).filter(Boolean);
          }

          return baseTimeline;
        })(),
        notes: caseData.notes,
        attachments: caseData.attachments,
        user: victimDetails,
        scammerId: caseData.scammerId,
        scammerDetails: scammerInfo ? {
          id: scammerInfo._id,
          name: scammerInfo.name,
          phoneNumber: scammerInfo.phoneNumber,
          email: scammerInfo.email,
          upiId: scammerInfo.upiId,
          bankAccount: scammerInfo.bankAccount,
          ifscCode: scammerInfo.ifscCode,
          address: scammerInfo.address,
          totalCases: scammerInfo.totalCases,
          status: scammerInfo.status
        } : null,
        adminComments: adminComments.map(comment => ({
          id: comment._id,
          comment: comment.comment,
          adminName: comment.adminName,
          createdAt: comment.createdAt
        })),
        // Police assignment information
        assignedTo: caseData.assignedTo || null,
        assignedToName: caseData.assignedToName || null,
        assignedAt: caseData.assignedAt || null
      }
    });

  } catch (error) {
    console.error('Get admin case details error:', error);
    console.error('Error stack:', error.stack);
    console.error('Case ID:', req.params.caseId);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Assign case to admin
router.patch('/cases/:caseId/assign', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const assignedBy = req.user.userId;

    const result = await db.collection('cases').updateOne(
      { $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }] },
      {
        $set: {
          assignedTo: assignedBy,
          updatedAt: new Date()
        },
        $push: {
          timeline: {
            status: 'assigned',
            timestamp: new Date(),
            description: 'Case assigned to admin',
            updatedBy: assignedBy
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      message: 'Case assigned successfully'
    });

  } catch (error) {
    console.error('Assign case error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get case analytics
router.get('/analytics/cases', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get case analytics
    const [
      totalCases,
      totalAmount,
      statusBreakdown,
      typeBreakdown,
      dailyStats,
      priorityBreakdown
    ] = await Promise.all([
      // Total cases in period
      db.collection('cases').countDocuments({
        createdAt: { $gte: startDate }
      }),

      // Total amount in period
      db.collection('cases').aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: { _id: null, total: { $sum: '$amount' } }
        }
      ]).toArray(),

      // Status breakdown
      db.collection('cases').aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]).toArray(),

      // Case type breakdown
      db.collection('cases').aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$caseType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]).toArray(),

      // Daily statistics
      db.collection('cases').aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]).toArray(),

      // Priority breakdown
      db.collection('cases').aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);

    res.json({
      success: true,
      analytics: {
        period,
        overview: {
          totalCases,
          totalAmount: totalAmount[0]?.total || 0
        },
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount
          };
          return acc;
        }, {}),
        typeBreakdown: typeBreakdown.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount
          };
          return acc;
        }, {}),
        priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        dailyStats: dailyStats.map(stat => ({
          date: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}-${stat._id.day.toString().padStart(2, '0')}`,
          count: stat.count,
          totalAmount: stat.totalAmount
        }))
      }
    });

  } catch (error) {
    console.error('Get case analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Process Management Routes
// Get process flow configuration
router.get('/process-flow', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Get process flow from database or return default
    let processFlow = await db.collection('processFlow').findOne({ type: 'default' });

    if (!processFlow) {
      // Create default process flow
      const defaultFlow = {
        type: 'default',
        steps: [
          { id: 'submitted', label: 'Report Submitted', description: 'Initial report received and logged', icon: '📄', color: '#3b82f6', order: 1 },
          { id: 'verified', label: 'Information Verified', description: 'Personal and contact details verified', icon: '✅', color: '#10b981', order: 2 },
          { id: 'under_review', label: 'Under Review', description: 'Case being reviewed by investigation team', icon: '🔍', color: '#f59e0b', order: 3 },
          { id: 'investigating', label: 'Active Investigation', description: 'Detailed investigation in progress', icon: '🕵️', color: '#ef4444', order: 4 },
          { id: 'evidence_collected', label: 'Evidence Collected', description: 'All relevant evidence gathered', icon: '📋', color: '#8b5cf6', order: 5 },
          { id: 'analysis_complete', label: 'Analysis Complete', description: 'Technical analysis and review finished', icon: '📊', color: '#06b6d4', order: 6 },
          { id: 'resolved', label: 'Case Resolved', description: 'Case successfully resolved', icon: '🎯', color: '#10b981', order: 7 },
          { id: 'closed', label: 'Case Closed', description: 'Case officially closed and archived', icon: '🔒', color: '#6b7280', order: 8 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('processFlow').insertOne(defaultFlow);
      processFlow = defaultFlow;
    }

    res.json({
      success: true,
      processFlow: processFlow.steps.sort((a, b) => a.order - b.order)
    });

  } catch (error) {
    console.error('Get process flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update process flow configuration
router.put('/process-flow', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { steps } = req.body;

    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid process flow steps'
      });
    }

    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.id || !step.label || !step.description || !step.icon || !step.color) {
        return res.status(400).json({
          success: false,
          message: `Invalid step at index ${i}. Required fields: id, label, description, icon, color`
        });
      }
      step.order = i + 1;
    }

    // Update or create process flow
    const result = await db.collection('processFlow').updateOne(
      { type: 'default' },
      {
        $set: {
          steps: steps,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Process flow updated successfully',
      processFlow: steps
    });

  } catch (error) {
    console.error('Update process flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update case status with process flow validation
router.put('/cases/:caseId/status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const { status, description, assignedTo } = req.body;
    const updatedBy = req.user.userId;

    // Get current process flow
    const processFlow = await db.collection('processFlow').findOne({ type: 'default' });
    const validStatuses = processFlow ? processFlow.steps.map(s => s.id) : ['submitted', 'under_review', 'investigating', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Get case
    const caseDoc = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }]
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Create timeline entry
    const timelineEntry = {
      status: status,
      timestamp: new Date(),
      description: description || `Status changed to ${status}`,
      updatedBy: updatedBy
    };

    // Update case
    const updateData = {
      status: status,
      updatedAt: new Date()
    };

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    const result = await db.collection('cases').findOneAndUpdate(
      { $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }] },
      {
        $set: updateData,
        $push: { timeline: timelineEntry }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      message: 'Case status updated successfully',
      case: {
        id: result._id,
        caseId: result.caseId,
        status: result.status,
        updatedAt: result.updatedAt,
        timeline: result.timeline
      }
    });

  } catch (error) {
    console.error('Update case status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Get comprehensive dashboard data
    const [
      totalUsers,
      totalCases,
      activeCases,
      resolvedCases,
      totalAmount,
      recentCases,
      users,
      statusBreakdown
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('cases').countDocuments(),
      db.collection('cases').countDocuments({
        status: { $nin: ['closed', 'resolved'] }
      }),
      db.collection('cases').countDocuments({
        status: { $in: ['resolved', 'closed'] }
      }),
      db.collection('cases').aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray(),
      db.collection('cases').aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        }
      ]).toArray(),
      db.collection('users').find({}, { projection: { password: 0 } }).limit(20).toArray(),
      db.collection('cases').aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);

    // Get case count for users
    const usersWithCaseCount = await Promise.all(
      users.map(async (user) => {
        const caseCount = await db.collection('cases').countDocuments({
          userId: user._id
        });
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          casesCount: caseCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCases,
        activeCases,
        resolvedCases,
        totalAmount: totalAmount[0]?.total || 0,
        recentCases: recentCases.map(caseDoc => ({
          id: caseDoc._id,
          caseId: caseDoc.caseId,
          caseType: caseDoc.caseType,
          description: caseDoc.description,
          amount: caseDoc.amount,
          status: caseDoc.status,
          priority: caseDoc.priority,
          createdAt: caseDoc.createdAt,
          user: caseDoc.user[0]
        })),
        users: usersWithCaseCount,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all cases with synchronized timeline
router.get('/cases', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { caseId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const cases = await db.collection('cases')
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count for pagination
    const total = await db.collection('cases').countDocuments(query);

    // Get comprehensive information for each case
    const casesWithDetails = await Promise.all(
      cases.map(async (caseDoc) => {
        const [user, userProfile, scammer, timeline, adminActions] = await Promise.all([
          db.collection('users').findOne({ _id: caseDoc.userId }),
          db.collection('userProfiles').findOne({ userId: caseDoc.userId }),
          db.collection('scammers').findOne({ cases: { $in: [caseDoc.caseId] } }),
          db.collection('case_timeline')
            .find({ caseId: caseDoc._id })
            .sort({ createdAt: 1 })
            .toArray(),
          db.collection('admin_actions')
            .find({ caseId: caseDoc._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray()
        ]);

        return {
          ...caseDoc,
          user: user ? {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
          } : null,
          userProfile: userProfile ? {
            aadhaar: userProfile.governmentIds?.aadhaarNumber,
            pan: userProfile.governmentIds?.panNumber,
            address: userProfile.addressInfo?.currentAddress
          } : null,
          scammer: scammer ? {
            id: scammer._id,
            name: scammer.name,
            phone: scammer.phoneNumber,
            email: scammer.email,
            upiId: scammer.upiId,
            bankAccount: scammer.bankAccount,
            totalCases: scammer.totalCases,
            status: scammer.status
          } : null,
          timeline: timeline.map(entry => ({
            id: entry._id,
            stage: entry.stage,
            stageName: entry.stageName,
            description: entry.description,
            icon: entry.icon,
            userVisible: entry.userVisible,
            adminComment: entry.adminComment,
            createdAt: entry.createdAt,
            createdByRole: entry.createdByRole
          })),
          adminActions: adminActions.map(action => ({
            id: action._id,
            action: action.action,
            comment: action.comment,
            createdAt: action.createdAt
          })),
          currentStage: caseDoc.status,
          nextPossibleStages: getNextPossibleStages(caseDoc.status)
        };
      })
    );

    res.json({
      success: true,
      data: {
        cases: casesWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get admin cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get police officers
router.get('/police-officers', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Get all users with police role
    const policeOfficers = await db.collection('users').find({
      role: 'police'
    }).project({
      _id: 1,
      name: 1,
      email: 1,
      badgeNumber: 1,
      department: 1,
      createdAt: 1
    }).toArray();

    res.json({
      success: true,
      data: policeOfficers
    });
  } catch (error) {
    console.error('Get police officers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch police officers'
    });
  }
});

// Get email configuration
router.get('/email-config', async (req, res) => {
  try {
    const emailConfig = {
      telecom: process.env.TELECOM_EMAIL || 'telecom@fraud.gov.in',
      banking: process.env.BANKING_EMAIL || 'banking@fraud.gov.in',
      nodal: process.env.NODAL_EMAIL || 'nodal@fraud.gov.in'
    };

    res.json({
      success: true,
      data: emailConfig
    });
  } catch (error) {
    console.error('Get email config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email configuration'
    });
  }
});

// Update email status
router.put('/cases/:caseId/email-status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const { emailStatus } = req.body;
    const updatedBy = req.user.userId;

    // Update case email status
    const result = await db.collection('cases').updateOne(
      { $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }] },
      {
        $set: {
          emailStatus: emailStatus,
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

    res.json({
      success: true,
      message: 'Email status updated successfully'
    });
  } catch (error) {
    console.error('Update email status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email status'
    });
  }
});

// Assign case to police officer
router.put('/cases/:caseId/assign-police', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const { policeId, policeName } = req.body;
    const adminId = req.user.userId;

    // Update case assignment
    const result = await db.collection('cases').updateOne(
      { $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }] },
      {
        $set: {
          assignedTo: policeId,
          assignedToName: policeName,
          assignedAt: new Date(),
          status: 'under_review',
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

    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      caseId: new ObjectId(caseId),
      stage: 'under_review',
      stageName: 'Under Review',
      status: 'completed',
      description: `Case assigned to police officer: ${policeName}`,
      icon: '👮',
      userVisible: true,
      adminComment: `Assigned to: ${policeName}`,
      createdBy: new ObjectId(adminId),
      createdByRole: 'admin',
      createdAt: new Date(),
      completedAt: new Date(),
      metadata: {
        assignedTo: policeId,
        assignedToName: policeName
      }
    });

    res.json({
      success: true,
      message: 'Case assigned to police officer successfully'
    });
  } catch (error) {
    console.error('Assign case to police error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign case to police officer'
    });
  }
});

// Download CRPC document
router.get('/cases/:caseId/crpc/download', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;

    // Get case data
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }]
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Get CRPC document
    const crpcDoc = await db.collection('crpc_documents').findOne({
      caseId: new ObjectId(caseId)
    });

    if (!crpcDoc) {
      return res.status(404).json({
        success: false,
        message: 'CRPC document not found'
      });
    }

    // Generate PDF content
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="91CRPC_${crpcDoc.documentNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('91 CrPC Document', 50, 50);
    doc.fontSize(16).text(`Document Number: ${crpcDoc.documentNumber}`, 50, 80);
    doc.fontSize(14).text(`Case ID: ${caseData.caseId}`, 50, 110);
    doc.fontSize(12).text(`Generated: ${new Date(crpcDoc.generatedAt).toLocaleString()}`, 50, 140);

    doc.moveDown();
    doc.fontSize(16).text('Case Details:', 50, 180);
    doc.fontSize(12).text(`Case Type: ${caseData.caseType}`, 50, 210);
    doc.text(`Amount: ₹${caseData.amount?.toLocaleString() || '0'}`, 50, 230);
    doc.text(`Status: ${caseData.status}`, 50, 250);

    doc.moveDown();
    doc.fontSize(16).text('91 CrPC Section Details:', 50, 290);
    doc.fontSize(12).text('This document is generated under Section 91 of the Code of Criminal Procedure, 1973.', 50, 320);
    doc.text('It authorizes the investigation officer to collect evidence and information', 50, 340);
    doc.text('related to the fraud case mentioned above.', 50, 360);

    doc.end();

  } catch (error) {
    console.error('Download CRPC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download CRPC document'
    });
  }
});

// Helper function to get next possible stages
function getNextPossibleStages(currentStatus) {
  const statusToStageMap = {
    'submitted': ['information_verified', 'rejected'],
    'verified': ['crpc_generated', 'under_review'],
    'crpc_generated': ['emails_sent'],
    'emails_sent': ['under_review'],
    'under_review': ['evidence_collected', 'resolved'],
    'evidence_collected': ['resolved'],
    'resolved': ['closed'],
    'rejected': ['submitted']
  };

  return statusToStageMap[currentStatus] || [];
}

// Verify information and collect scammer details
router.post('/cases/:caseId/verify-information', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const timelineManager = new TimelineManager(db);
    const scammerManager = new ScammerManager(db);
    const { caseId } = req.params;
    const { scammerDetails, additionalInfo } = req.body;

    // Get case details
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }]
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Process scammer information if provided
    let scammerInfo = null;
    if (scammerDetails) {
      scammerInfo = await scammerManager.processScammerInfo({
        ...scammerDetails,
        amount: caseData.amount
      }, caseData._id);
    }

    // Update case with scammer details
    const updateData = {
      updatedAt: new Date()
    };

    if (scammerInfo) {
      updateData.scammerDetails = [scammerInfo.scammerDetails];
      updateData.scammerId = scammerInfo.scammerId;
    }

    if (additionalInfo) {
      updateData.additionalInfo = additionalInfo;
    }

    await db.collection('cases').updateOne(
      { _id: caseData._id },
      { $set: updateData }
    );

    // Add timeline entry
    await timelineManager.addTimelineEntry(
      caseData._id,
      'information_verified',
      'Information Verified',
      'completed',
      scammerInfo ?
        `Scammer details verified and ${scammerInfo.isNew ? 'added to' : 'updated in'} database` :
        'Personal and contact details verified',
      { scammerInfo: scammerInfo?.scammerDetails },
      { userId: req.user.userId, role: 'admin', name: req.user.name || 'Admin' }
    );

    res.json({
      success: true,
      message: 'Information verified successfully',
      scammerInfo
    });
  } catch (error) {
    console.error('Verify information error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify information'
    });
  }
});

// Generate 91 CrPC document
router.post('/cases/:caseId/generate-crpc', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const timelineManager = new TimelineManager(db);
    const { caseId } = req.params;

    // Get case details
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }]
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if scammer details exist
    if (!caseData.scammerDetails || caseData.scammerDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Scammer details must be collected before generating 91 CrPC document'
      });
    }

    // Generate CRPC document ID
    const crpcDocumentId = `CRPC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Update case with CRPC document ID
    await db.collection('cases').updateOne(
      { _id: caseData._id },
      {
        $set: {
          crpcDocumentId,
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await timelineManager.addTimelineEntry(
      caseData._id,
      'crpc_generated',
      '91 CrPC Generated',
      'completed',
      `Legal document generated under Section 91 of CrPC. Document ID: ${crpcDocumentId}`,
      { crpcDocumentId },
      { userId: req.user.userId, role: 'admin', name: req.user.name || 'Admin' }
    );

    res.json({
      success: true,
      message: '91 CrPC document generated successfully',
      crpcDocumentId
    });
  } catch (error) {
    console.error('Generate CRPC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate 91 CrPC document'
    });
  }
});

// Send emails to authorities
router.post('/cases/:caseId/send-emails', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const timelineManager = new TimelineManager(db);
    const { caseId } = req.params;

    // Get case details
    const caseData = await db.collection('cases').findOne({
      $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }]
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if CRPC document exists
    if (!caseData.crpcDocumentId) {
      return res.status(400).json({
        success: false,
        message: '91 CrPC document must be generated before sending emails'
      });
    }

    // Simulate email sending (replace with actual email service)
    const emailStatus = {
      telecom: 'sent',
      banking: 'sent',
      nodal: 'sent',
      lastSent: new Date()
    };

    // Update case with email status
    await db.collection('cases').updateOne(
      { _id: caseData._id },
      {
        $set: {
          emailStatus,
          updatedAt: new Date()
        }
      }
    );

    // Add timeline entry
    await timelineManager.addTimelineEntry(
      caseData._id,
      'emails_sent',
      'Authorities Notified',
      'completed',
      '91 CrPC document sent to relevant authorities (Telecom, Banking, Nodal)',
      { emailStatus },
      { userId: req.user.userId, role: 'admin', name: req.user.name || 'Admin' }
    );

    res.json({
      success: true,
      message: 'Emails sent to authorities successfully',
      emailStatus
    });
  } catch (error) {
    console.error('Send emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails to authorities'
    });
  }
});

module.exports = { adminRouter: router };
