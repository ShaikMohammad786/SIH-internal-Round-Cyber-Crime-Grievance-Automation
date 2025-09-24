const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get all scammers (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const scammers = await db.collection('scammers')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('scammers').countDocuments(query);

    res.json({
      success: true,
      data: scammers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get scammers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving scammers'
    });
  }
});

// Create scammer profile with enhanced duplicate detection
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { 
      phoneNumber, 
      email, 
      upiId, 
      bankAccount, 
      ifscCode, 
      name, 
      address, 
      caseId,
      evidenceType,
      evidenceDetails 
    } = req.body;
    
    const db = req.app.locals.db;

    // Enhanced duplicate detection - check all possible identifiers
    const searchCriteria = [];
    if (phoneNumber) searchCriteria.push({ phoneNumber: phoneNumber });
    if (email) searchCriteria.push({ email: email });
    if (upiId) searchCriteria.push({ upiId: upiId });
    if (bankAccount) searchCriteria.push({ bankAccount: bankAccount });
    if (ifscCode) searchCriteria.push({ ifscCode: ifscCode });

    const existingScammer = await db.collection('scammers').findOne({
      $or: searchCriteria
    });

    let scammerId;
    
    if (existingScammer) {
      // Update existing scammer with new case
      scammerId = existingScammer._id;
      await db.collection('scammers').updateOne(
        { _id: existingScammer._id },
        { 
          $addToSet: { 
            cases: caseId,
            evidenceTypes: evidenceType
          },
          $set: { 
            lastSeen: new Date(),
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
        cases: [caseId],
        evidenceTypes: [evidenceType],
        totalCases: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active' // active, blocked, under_investigation
      };
      
      const result = await db.collection('scammers').insertOne(newScammer);
      scammerId = result.insertedId;
    }

    // Link case to scammer
    await db.collection('cases').updateOne(
      { _id: new ObjectId(caseId) },
      { 
        $set: { 
          scammerId: scammerId,
          scammerDetails: {
            phoneNumber,
            email,
            upiId,
            bankAccount,
            ifscCode,
            name,
            address
          },
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Scammer profile created/updated successfully',
      scammerId: scammerId
    });

  } catch (error) {
    console.error('Create scammer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get scammer details
router.get('/:scammerId', authenticateToken, async (req, res) => {
  try {
    const { scammerId } = req.params;
    const db = req.app.locals.db;

    const scammer = await db.collection('scammers').findOne({ 
      _id: new ObjectId(scammerId) 
    });

    if (!scammer) {
      return res.status(404).json({
        success: false,
        message: 'Scammer not found'
      });
    }

    // Get related cases
    const relatedCases = await db.collection('cases').find({
      _id: { $in: scammer.cases.map(id => new ObjectId(id)) }
    }).toArray();

    res.json({
      success: true,
      scammer: {
        ...scammer,
        relatedCases: relatedCases
      }
    });

  } catch (error) {
    console.error('Get scammer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search scammers
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const db = req.app.locals.db;

    const scammers = await db.collection('scammers').find({
      $or: [
        { phoneNumber: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { upiId: { $regex: query, $options: 'i' } },
        { bankAccount: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).limit(10).toArray();

    res.json({
      success: true,
      scammers: scammers
    });

  } catch (error) {
    console.error('Search scammers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update scammer status
router.put('/:scammerId/status', authenticateToken, async (req, res) => {
  try {
    const { scammerId } = req.params;
    const { status } = req.body;
    const db = req.app.locals.db;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    await db.collection('scammers').updateOne(
      { _id: new ObjectId(scammerId) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Scammer status updated successfully'
    });

  } catch (error) {
    console.error('Update scammer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
