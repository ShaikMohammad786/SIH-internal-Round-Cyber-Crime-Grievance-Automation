const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const TimelineManager = require('../utils/timelineManager');
const ScammerManager = require('../utils/scammerManager');
const router = express.Router();

// Create or update user profile with Aadhaar/PAN details
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;

    const {
      personalInfo,
      contactInfo,
      governmentIds,
      addressInfo
    } = req.body;

    // Validate required fields
    if (!personalInfo || !governmentIds) {
      return res.status(400).json({
        success: false,
        message: 'Personal information and government IDs are required'
      });
    }

    // Check if profile already exists
    const existingProfile = await db.collection('userProfiles').findOne({
      userId: new ObjectId(userId)
    });

    const profileData = {
      userId: new ObjectId(userId),
      personalInfo: {
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName || '',
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth,
        gender: personalInfo.gender,
        nationality: personalInfo.nationality || 'Indian'
      },
      contactInfo: {
        email: contactInfo.email,
        phone: contactInfo.phone,
        alternatePhone: contactInfo.alternatePhone || '',
        emergencyContact: contactInfo.emergencyContact || {}
      },
      governmentIds: {
        aadhaarNumber: governmentIds.aadhaarNumber,
        panNumber: governmentIds.panNumber,
        otherIds: governmentIds.otherIds || []
      },
      addressInfo: {
        currentAddress: addressInfo.currentAddress || {},
        permanentAddress: addressInfo.permanentAddress || {},
        officeAddress: addressInfo.officeAddress || {}
      },
      createdAt: existingProfile ? existingProfile.createdAt : new Date(),
      updatedAt: new Date(),
      isVerified: false
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await db.collection('userProfiles').updateOne(
        { userId: new ObjectId(userId) },
        { $set: profileData }
      );
    } else {
      // Create new profile
      result = await db.collection('userProfiles').insertOne(profileData);
    }

    // Also update the main user collection with basic info
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name: `${personalInfo.firstName} ${personalInfo.lastName}`,
          phone: contactInfo.phone,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
      profile: {
        id: existingProfile ? existingProfile._id : result.insertedId,
        ...profileData
      }
    });

  } catch (error) {
    console.error('Profile creation/update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;

    const profile = await db.collection('userProfiles').findOne({
      userId: new ObjectId(userId)
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile: {
        id: profile._id,
        personalInfo: profile.personalInfo,
        contactInfo: profile.contactInfo,
        governmentIds: profile.governmentIds,
        addressInfo: profile.addressInfo,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        isVerified: profile.isVerified
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get previous cases by Aadhaar or PAN
router.get('/previous-cases', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;
    const { aadhaarNumber, panNumber } = req.query;

    if (!aadhaarNumber && !panNumber) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number or PAN number is required'
      });
    }

    // Build query for previous cases
    const query = {};
    if (aadhaarNumber) {
      query['governmentIds.aadhaarNumber'] = aadhaarNumber;
    }
    if (panNumber) {
      query['governmentIds.panNumber'] = panNumber;
    }

    // Find all profiles matching the Aadhaar/PAN
    const matchingProfiles = await db.collection('userProfiles').find(query).toArray();
    const matchingUserIds = matchingProfiles.map(profile => profile.userId);

    if (matchingUserIds.length === 0) {
      return res.json({
        success: true,
        message: 'No previous cases found',
        cases: [],
        totalCases: 0
      });
    }

    // Get cases for all matching users
    const previousCases = await db.collection('cases').find({
      userId: { $in: matchingUserIds }
    })
      .sort({ createdAt: -1 })
      .toArray();

    // Format response
    const formattedCases = previousCases.map(caseDoc => ({
      id: caseDoc._id,
      caseId: caseDoc.caseId,
      caseType: caseDoc.caseType,
      description: caseDoc.description,
      amount: caseDoc.amount,
      status: caseDoc.status,
      priority: caseDoc.priority,
      incidentDate: caseDoc.incidentDate,
      createdAt: caseDoc.createdAt,
      updatedAt: caseDoc.updatedAt,
      timeline: caseDoc.timeline,
      isCurrentUser: caseDoc.userId.toString() === userId
    }));

    res.json({
      success: true,
      message: 'Previous cases retrieved successfully',
      cases: formattedCases,
      totalCases: formattedCases.length,
      searchCriteria: {
        aadhaarNumber: aadhaarNumber || null,
        panNumber: panNumber || null
      }
    });

  } catch (error) {
    console.error('Get previous cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get ONLY the current user's cases
router.get('/my-cases', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;

    const myCases = await db.collection('cases')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Get timeline for each case
    const casesWithTimeline = await Promise.all(
      myCases.map(async (doc) => {
        const timeline = await db.collection('case_timeline').find({
          caseId: doc._id
        }).sort({ createdAt: 1 }).toArray();

        return {
          id: doc._id,
          caseId: doc.caseId,
          caseType: doc.caseType,
          description: doc.description,
          amount: doc.amount,
          status: doc.status,
          priority: doc.priority,
          incidentDate: doc.incidentDate,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          timeline: timeline.length > 0 ? timeline.map(t => ({
            id: t._id,
            stage: t.stage,
            status: t.status,
            description: t.description,
            completedAt: t.completedAt,
            icon: t.icon
          })) : [
            {
              id: '1',
              stage: 'Report Submitted',
              status: 'completed',
              description: 'Initial report received and logged.',
              completedAt: doc.createdAt,
              icon: '📄'
            },
            {
              id: '2',
              stage: 'Information Verified',
              status: ['verified', 'under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(doc.status) ? 'completed' : 'pending',
              description: 'Personal and contact details verified.',
              completedAt: ['verified', 'under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(doc.status) ? new Date().toISOString() : null,
              icon: '🔍'
            },
            {
              id: '3',
              stage: 'Under Review',
              status: ['under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(doc.status) ? 'completed' : 'pending',
              description: 'Case being reviewed by investigation team.',
              completedAt: ['under_review', 'evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(doc.status) ? new Date().toISOString() : null,
              icon: '🔍'
            },
            {
              id: '4',
              stage: 'Evidence Collected',
              status: ['evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(doc.status) ? 'completed' : 'pending',
              description: 'All relevant evidence gathered.',
              completedAt: ['evidence_collected', 'crpc_generated', 'resolved', 'closed'].includes(doc.status) ? new Date().toISOString() : null,
              icon: '📋'
            },
            {
              id: '5',
              stage: 'Case Resolved',
              status: ['resolved', 'closed'].includes(doc.status) ? 'completed' : 'pending',
              description: 'Technical analysis and review finished.',
              completedAt: ['resolved', 'closed'].includes(doc.status) ? new Date().toISOString() : null,
              icon: '📊'
            },
            {
              id: '6',
              stage: 'Case Closed',
              status: doc.status === 'closed' ? 'completed' : 'pending',
              description: 'Case successfully closed.',
              completedAt: doc.status === 'closed' ? new Date().toISOString() : null,
              icon: '✅'
            }
          ]
        };
      })
    );

    const formatted = casesWithTimeline;

    res.json({
      success: true,
      cases: formatted,
      total: formatted.length
    });
  } catch (error) {
    console.error('Get my cases error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create comprehensive case with full form data
router.post('/create-case', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;
    const timelineManager = new TimelineManager(db);
    const scammerManager = new ScammerManager(db);

    const {
      caseType,
      description,
      amount,
      incidentDate,
      location,
      contactInfo,
      evidence,
      formData // Complete form data as JSON
    } = req.body;

    // Debug: Log the request body structure
    console.log('Request body structure:', Object.keys(req.body));
    console.log('FormData in request:', !!req.body.formData);
    console.log('FormData type:', typeof req.body.formData);

    console.log('Received case creation request:', {
      caseType,
      description,
      amount,
      incidentDate,
      location,
      hasContactInfo: !!contactInfo,
      hasEvidence: !!evidence,
      hasFormData: !!formData
    });

    // Validate required fields
    if (!caseType || !description || amount === undefined || amount === null || !incidentDate || !location) {
      console.log('Validation failed - missing fields:', {
        caseType: !!caseType,
        description: !!description,
        amount: !!amount,
        incidentDate: !!incidentDate,
        location: !!location,
        locationState: location?.state,
        locationCity: location?.city
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate unique case ID
    const generateCaseId = async () => {
      let caseId;
      let isUnique = false;

      while (!isUnique) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        caseId = `FRD-${timestamp}-${random}`;

        // Check if case ID already exists
        const existingCase = await db.collection('cases').findOne({ caseId });
        if (!existingCase) {
          isUnique = true;
        }
      }

      return caseId;
    };

    // Generate unique case ID
    const uniqueCaseId = await generateCaseId();

    // Process scammer information
    let scammerInfo = null;
    if (formData?.incidentInfo?.suspectInfo) {
      const suspectInfo = formData.incidentInfo.suspectInfo;
      const scammerData = {
        name: suspectInfo.name || '',
        phone: suspectInfo.phone || '',
        email: suspectInfo.email || '',
        bankAccount: suspectInfo.bankAccount || '',
        website: suspectInfo.website || '',
        address: suspectInfo.address || '',
        additionalInfo: suspectInfo.additionalInfo || '',
        amount: parseFloat(amount)
      };

      scammerInfo = await scammerManager.processScammerInfo(scammerData, uniqueCaseId);
      console.log('Scammer processed:', scammerInfo);
    }

    // DEBUG: Log the form data being received
    console.log('=== CASE CREATION DEBUG ===');
    console.log('Case ID:', uniqueCaseId);
    console.log('Form Data Received:', JSON.stringify(formData, null, 2));
    console.log('Form Data Type:', typeof formData);
    console.log('Form Data Keys:', Object.keys(formData || {}));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('===========================');

    // Create comprehensive case object with all form data
    const newCase = {
      caseId: uniqueCaseId,
      userId: new ObjectId(userId),
      caseType,
      description,
      amount: parseFloat(amount),
      incidentDate: new Date(incidentDate),
      location,
      contactInfo: contactInfo || {},
      evidence: evidence || [],
      status: 'submitted',
      priority: 'medium',
      assignedTo: null,
      scammerDetails: scammerInfo ? [scammerInfo.scammerDetails] : [],
      scammerId: scammerInfo ? scammerInfo.scammerId : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [],
      notes: [],
      attachments: [],
      // Store complete form data as JSON - use the structured formData from frontend
      formData: req.body.formData || formData || {
        personalInfo: {
          firstName: formData.firstName || '',
          middleName: formData.middleName || '',
          lastName: formData.lastName || '',
          dateOfBirth: formData.dateOfBirth || '',
          gender: formData.gender || '',
          nationality: formData.nationality || ''
        },
        contactInfo: {
          email: formData.email || '',
          phone: formData.primaryPhone || '',
          alternatePhone: formData.alternatePhone || '',
          emergencyContact: {
            name: formData.emergencyContactName || '',
            phone: formData.emergencyContactPhone || '',
            relation: formData.emergencyContactRelation || ''
          }
        },
        addressInfo: {
          currentAddress: {
            street: formData.streetAddress || '',
            city: formData.city || '',
            state: formData.state || '',
            postalCode: formData.postalCode || '',
            country: formData.country || 'India'
          }
        },
        governmentIds: {
          aadhaarNumber: formData.aadhaarNumber || '',
          panNumber: formData.panNumber || '',
          otherIds: formData.otherGovernmentIds ? [formData.otherGovernmentIds] : []
        },
        incidentInfo: {
          incidentDate: formData.incidentDate || '',
          incidentTime: formData.incidentTime || '',
          scamType: formData.scamType || '',
          incidentDescription: formData.incidentDescription || '',
          communicationMethod: formData.communicationMethod || '',
          suspectInfo: {
            name: formData.scammerName || '',
            phone: formData.scammerPhone || '',
            email: formData.scammerEmail || '',
            website: formData.scammerWebsite || '',
            bankAccount: formData.scammerBankAccount || '',
            additionalInfo: formData.additionalInfo || ''
          }
        },
        financialInfo: {
          moneyLost: formData.moneyLost || '',
          sensitiveInfoShared: formData.sensitiveInfoShared || '',
          actionsTaken: formData.actionsTaken || ''
        },
        evidenceInfo: {
          evidenceFiles: formData.evidenceFiles || []
        }
      }
    };

    // Insert case into database
    const result = await db.collection('cases').insertOne(newCase);

    // Add initial timeline entry
    await timelineManager.addTimelineEntry(
      result.insertedId,
      'report_submitted',
      'Report Submitted',
      'completed',
      `Initial fraud report received and logged. Case ID: ${uniqueCaseId}`,
      { caseId: uniqueCaseId },
      { userId, role: 'user', name: req.user.name || 'User' }
    );

    // Process scammer data if provided
    if (formData.scammerInfo) {
      await processScammerData(db, formData.scammerInfo, result.insertedId, newCase.caseId);
    }

    // Update or create user profile if form data contains profile info
    if (formData.personalInfo && formData.governmentIds) {
      const profileData = {
        userId: new ObjectId(userId),
        personalInfo: formData.personalInfo,
        contactInfo: formData.contactInfo,
        governmentIds: formData.governmentIds,
        addressInfo: formData.addressInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false
      };

      // Check if profile exists
      const existingProfile = await db.collection('userProfiles').findOne({
        userId: new ObjectId(userId)
      });

      if (existingProfile) {
        await db.collection('userProfiles').updateOne(
          { userId: new ObjectId(userId) },
          { $set: profileData }
        );
      } else {
        await db.collection('userProfiles').insertOne(profileData);
      }
    }

    // Extract and upsert scammer records (unique by identifier)
    try {
      const scammersCol = db.collection('scammers');
      const identifiers = [];

      // Helper: add identifier if value present
      const addId = (type, value) => {
        if (typeof value !== 'string') return;
        const trimmed = value.trim();
        if (!trimmed) return;
        identifiers.push({ type, value: trimmed.toLowerCase() });
      };

      // From suspectInfo (free text) - extract phones, emails, UPI IDs, account nos
      const suspectText = formData?.incidentInfo?.suspectInfo || '';
      if (suspectText) {
        const phones = Array.from(new Set((suspectText.match(/\b[6-9]\d{9}\b/g) || [])));
        const emails = Array.from(new Set((suspectText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])));
        const upis = Array.from(new Set((suspectText.match(/[a-z0-9.\-_]{3,}@[a-z]{2,}/gi) || []))); // example: name@upi
        const accounts = Array.from(new Set((suspectText.match(/\b\d{9,16}\b/g) || []))); // bank account numbers
        phones.forEach(p => addId('phone', p));
        emails.forEach(e => addId('email', e));
        upis.forEach(u => addId('upi', u));
        accounts.forEach(a => addId('account', a));
      }

      // From financialInfo
      const fin = formData?.financialInfo || {};
      addId('ifsc', fin?.bankDetails?.ifscCode);
      addId('account', fin?.bankDetails?.accountNumber);
      if (typeof fin?.paymentMethod === 'string') addId('paymentMethod', fin.paymentMethod);

      // From contactInfo that might belong to scammer (emails, phoneRecords)
      const evidenceInfo = formData?.evidenceInfo || {};
      (evidenceInfo.emails || []).forEach(e => addId('email', e));
      (evidenceInfo.phoneRecords || []).forEach(p => addId('phone', p));

      // De-duplicate identifiers by (type,value)
      const seen = new Set();
      const uniqueIds = identifiers.filter(id => {
        const key = `${id.type}:${id.value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Upsert scammers and link case
      const createdScammerIds = [];
      for (const ident of uniqueIds) {
        const resUp = await scammersCol.findOneAndUpdate(
          { [`identifiers.${ident.type}`]: ident.value },
          {
            $setOnInsert: {
              createdAt: new Date(),
              riskScore: 0
            },
            $set: {
              updatedAt: new Date()
            },
            $addToSet: {
              cases: result.insertedId
            },
            $inc: { caseCount: 1 }
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        );

        // Ensure identifiers object accumulates all types
        await scammersCol.updateOne(
          { _id: resUp.value._id },
          { $set: { [`identifiers.${ident.type}`]: ident.value } }
        );

        createdScammerIds.push(resUp.value._id);
      }

      // Link scammers back to the case
      if (createdScammerIds.length > 0) {
        await db.collection('cases').updateOne(
          { _id: result.insertedId },
          {
            $set: {
              scammers: createdScammerIds
            }
          }
        );
      }
    } catch (scamErr) {
      console.error('Scammer upsert error:', scamErr);
      // Non-fatal; continue
    }

    // Get the created case
    const createdCase = await db.collection('cases').findOne(
      { _id: result.insertedId },
      { projection: { formData: 0 } } // Don't return form data in response for security
    );

    res.status(201).json({
      success: true,
      message: 'Case created successfully with complete form data',
      case: {
        id: createdCase._id,
        caseId: createdCase.caseId,
        caseType: createdCase.caseType,
        description: createdCase.description,
        amount: createdCase.amount,
        status: createdCase.status,
        createdAt: createdCase.createdAt
      }
    });

  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's fresh dashboard data
router.get('/dashboard-fresh', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;

    // Get user profile
    const profile = await db.collection('userProfiles').findOne({
      userId: new ObjectId(userId)
    });

    // Get recent cases (last 5)
    const recentCases = await db.collection('cases').find({
      userId: new ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get case statistics
    const stats = await db.collection('cases').aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          underReview: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
          investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
          activeCases: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_review', 'investigating']] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
        }
      }
    ]).toArray();

    const result = stats[0] || {
      totalCases: 0,
      totalAmount: 0,
      submitted: 0,
      underReview: 0,
      investigating: 0,
      activeCases: 0,
      resolved: 0,
      closed: 0
    };

    // Get user info
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    res.json({
      success: true,
      dashboard: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        profile: profile ? {
          hasProfile: true,
          isVerified: profile.isVerified,
          governmentIds: profile.governmentIds
        } : {
          hasProfile: false,
          isVerified: false,
          governmentIds: null
        },
        recentCases: recentCases.map(caseDoc => ({
          id: caseDoc._id,
          caseId: caseDoc.caseId,
          caseType: caseDoc.caseType,
          description: caseDoc.description,
          amount: caseDoc.amount,
          status: caseDoc.status,
          priority: caseDoc.priority,
          incidentDate: caseDoc.incidentDate,
          createdAt: caseDoc.createdAt,
          updatedAt: caseDoc.updatedAt
        })),
        statistics: {
          totalCases: result.totalCases,
          totalAmount: result.totalAmount,
          activeCases: result.activeCases,
          statusBreakdown: {
            submitted: result.submitted,
            underReview: result.underReview,
            investigating: result.investigating,
            resolved: result.resolved,
            closed: result.closed
          }
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard fresh data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update case status
router.put('/case/:caseId/status', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const { status, description, assignedTo } = req.body;
    const userId = req.user.userId;

    // Validate status
    const validStatuses = ['submitted', 'under_review', 'investigating', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Check if case exists and belongs to user (or user is admin)
    const caseDoc = await db.collection('cases').findOne({
      _id: new ObjectId(caseId)
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user owns the case or is admin
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (caseDoc.userId.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own cases.'
      });
    }

    // Update case status
    const updateData = {
      status: status,
      updatedAt: new Date()
    };

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    // Add timeline entry
    const timelineEntry = {
      status: status,
      timestamp: new Date(),
      description: description || `Status changed to ${status}`,
      updatedBy: userId
    };

    const result = await db.collection('cases').findOneAndUpdate(
      { _id: new ObjectId(caseId) },
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
      message: 'Failed to update case status'
    });
  }
});

// Get case details with full timeline
router.get('/case/:caseId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const userId = req.user.userId;

    // Get case details
    const caseDoc = await db.collection('cases').findOne({
      _id: new ObjectId(caseId)
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user owns the case or is admin
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (caseDoc.userId.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own cases.'
      });
    }

    // Get assigned user details if assignedTo exists
    let assignedUser = null;
    if (caseDoc.assignedTo) {
      assignedUser = await db.collection('users').findOne(
        { _id: new ObjectId(caseDoc.assignedTo) },
        { projection: { name: 1, email: 1, role: 1 } }
      );
    }

    res.json({
      success: true,
      case: {
        id: caseDoc._id,
        caseId: caseDoc.caseId,
        caseType: caseDoc.caseType,
        description: caseDoc.description,
        amount: caseDoc.amount,
        status: caseDoc.status,
        priority: caseDoc.priority,
        incidentDate: caseDoc.incidentDate,
        location: caseDoc.location,
        contactInfo: caseDoc.contactInfo,
        evidence: (caseDoc.evidence || []).map(ev => ({
          id: ev._id,
          name: ev.name || ev.fileName || 'unnamed_file',
          size: ev.size || ev.fileSize || 0,
          type: ev.type || ev.fileType || 'unknown',
          url: ev.url || ev.data || ev.fileUrl || null,
          uploadedAt: ev.uploadedAt || new Date()
        })),
        formData: caseDoc.formData,
        timeline: caseDoc.timeline || [],
        assignedTo: assignedUser,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      }
    });

  } catch (error) {
    console.error('Get case details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get case details'
    });
  }
});

// Process scammer data and create/update scammer profile
async function processScammerData(db, scammerInfo, caseId, caseIdString) {
  try {
    const { phoneNumber, email, upiId, bankAccount, ifscCode, name, address } = scammerInfo;

    if (!phoneNumber && !email && !upiId && !bankAccount) {
      return; // No scammer data to process
    }

    // Check for existing scammer
    const searchCriteria = [];
    if (phoneNumber) searchCriteria.push({ phoneNumber: phoneNumber });
    if (email) searchCriteria.push({ email: email });
    if (upiId) searchCriteria.push({ upiId: upiId });
    if (bankAccount) searchCriteria.push({ bankAccount: bankAccount });

    const existingScammer = await db.collection('scammers').findOne({
      $or: searchCriteria
    });

    if (existingScammer) {
      // Update existing scammer
      await db.collection('scammers').updateOne(
        { _id: existingScammer._id },
        {
          $addToSet: {
            cases: caseIdString,
            evidenceTypes: 'user_report'
          },
          $set: {
            lastSeen: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Link case to scammer
      await db.collection('cases').updateOne(
        { _id: caseId },
        {
          $set: {
            scammerId: existingScammer._id,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Create new scammer profile
      const newScammer = {
        phoneNumber: phoneNumber || null,
        email: email || null,
        upiId: upiId || null,
        bankAccount: bankAccount || null,
        ifscCode: ifscCode || null,
        name: name || 'Unknown',
        address: address || null,
        cases: [caseIdString],
        evidenceTypes: ['user_report'],
        totalCases: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const scammerResult = await db.collection('scammers').insertOne(newScammer);

      // Link case to scammer
      await db.collection('cases').updateOne(
        { _id: caseId },
        {
          $set: {
            scammerId: scammerResult.insertedId,
            updatedAt: new Date()
          }
        }
      );
    }
  } catch (error) {
    console.error('Error processing scammer data:', error);
  }
}

module.exports = { userProfilesRouter: router };
