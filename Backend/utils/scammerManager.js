const { ObjectId } = require('mongodb');

class ScammerManager {
  constructor(db) {
    this.db = db;
  }

  // Check if scammer already exists in database
  async findExistingScammer(scammerInfo) {
    try {
      const { name, phone, email, bankAccount, website } = scammerInfo;
      
      // Search by multiple criteria
      const searchCriteria = [];
      
      if (name) {
        searchCriteria.push({ 'scammerDetails.name': { $regex: name, $options: 'i' } });
      }
      if (phone) {
        searchCriteria.push({ 'scammerDetails.phone': phone });
      }
      if (email) {
        searchCriteria.push({ 'scammerDetails.email': { $regex: email, $options: 'i' } });
      }
      if (bankAccount) {
        searchCriteria.push({ 'scammerDetails.bankAccount': bankAccount });
      }
      if (website) {
        searchCriteria.push({ 'scammerDetails.website': { $regex: website, $options: 'i' } });
      }

      if (searchCriteria.length === 0) {
        return null;
      }

      const existingScammer = await this.db.collection('scammers').findOne({
        $or: searchCriteria
      });

      return existingScammer;
    } catch (error) {
      console.error('Error finding existing scammer:', error);
      throw error;
    }
  }

  // Add new scammer to database
  async addScammer(scammerInfo, caseId) {
    try {
      const scammerData = {
        scammerDetails: {
          name: scammerInfo.name || '',
          phone: scammerInfo.phone || '',
          email: scammerInfo.email || '',
          bankAccount: scammerInfo.bankAccount || '',
          website: scammerInfo.website || '',
          address: scammerInfo.address || '',
          additionalInfo: scammerInfo.additionalInfo || ''
        },
        firstReportedCase: new ObjectId(caseId),
        firstReportedAt: new Date(),
        lastReportedAt: new Date(),
        totalReports: 1,
        totalAmountScammed: scammerInfo.amount || 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.db.collection('scammers').insertOne(scammerData);
      return result.insertedId;
    } catch (error) {
      console.error('Error adding scammer:', error);
      throw error;
    }
  }

  // Update existing scammer with new case info
  async updateScammer(scammerId, caseId, amount) {
    try {
      await this.db.collection('scammers').updateOne(
        { _id: new ObjectId(scammerId) },
        {
          $inc: {
            totalReports: 1,
            totalAmountScammed: amount || 0
          },
          $set: {
            lastReportedAt: new Date(),
            updatedAt: new Date()
          },
          $addToSet: {
            reportedCases: new ObjectId(caseId)
          }
        }
      );
    } catch (error) {
      console.error('Error updating scammer:', error);
      throw error;
    }
  }

  // Process scammer information for a case
  async processScammerInfo(scammerInfo, caseId) {
    try {
      console.log('Processing scammer info:', scammerInfo);
      
      // Check if scammer already exists
      const existingScammer = await this.findExistingScammer(scammerInfo);
      
      if (existingScammer) {
        console.log('Found existing scammer:', existingScammer._id);
        // Update existing scammer
        await this.updateScammer(existingScammer._id, caseId, scammerInfo.amount);
        return {
          isNew: false,
          scammerId: existingScammer._id,
          scammerDetails: existingScammer.scammerDetails
        };
      } else {
        console.log('Creating new scammer record');
        // Add new scammer
        const scammerId = await this.addScammer(scammerInfo, caseId);
        return {
          isNew: true,
          scammerId: scammerId,
          scammerDetails: scammerInfo
        };
      }
    } catch (error) {
      console.error('Error processing scammer info:', error);
      throw error;
    }
  }

  // Get scammer details by ID
  async getScammerDetails(scammerId) {
    try {
      const scammer = await this.db.collection('scammers').findOne({
        _id: new ObjectId(scammerId)
      });
      return scammer;
    } catch (error) {
      console.error('Error getting scammer details:', error);
      throw error;
    }
  }

  // Get all scammers with pagination
  async getAllScammers(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const scammers = await this.db.collection('scammers')
        .find({})
        .sort({ lastReportedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.db.collection('scammers').countDocuments();

      return {
        scammers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all scammers:', error);
      throw error;
    }
  }
}

module.exports = ScammerManager;
