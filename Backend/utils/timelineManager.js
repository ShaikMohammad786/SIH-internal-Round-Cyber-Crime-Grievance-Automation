const { ObjectId } = require('mongodb');

class TimelineManager {
  constructor(db) {
    this.db = db;
  }

  // Add timeline entry
  async addTimelineEntry(caseId, stage, stageName, status, description, metadata = {}, userInfo = {}) {
    try {
      const timelineEntry = {
        caseId: new ObjectId(caseId),
        stage,
        stageName,
        status, // 'pending', 'in_progress', 'completed', 'failed'
        description,
        metadata,
        userInfo: {
          userId: userInfo.userId ? new ObjectId(userInfo.userId) : null,
          role: userInfo.role || 'system',
          name: userInfo.name || 'System'
        },
        createdAt: new Date(),
        completedAt: status === 'completed' ? new Date() : null,
        userVisible: true
      };

      const result = await this.db.collection('case_timeline').insertOne(timelineEntry);
      
      // Update case status if needed
      if (status === 'completed') {
        await this.updateCaseStatus(caseId, stage, metadata);
      }

      return result.insertedId;
    } catch (error) {
      console.error('Error adding timeline entry:', error);
      throw error;
    }
  }

  // Update case status based on timeline stage
  async updateCaseStatus(caseId, stage, metadata = {}) {
    try {
      const updateFields = {
        updatedAt: new Date()
      };

      switch (stage) {
        case 'report_submitted':
          updateFields.status = 'submitted';
          break;
        case 'information_verified':
          updateFields.status = 'information_verified';
          if (metadata.scammerDetails) {
            updateFields.scammerDetails = metadata.scammerDetails;
          }
          break;
        case 'crpc_generated':
          updateFields.status = 'crpc_generated';
          if (metadata.crpcDocumentId) {
            updateFields.crpcDocumentId = metadata.crpcDocumentId;
          }
          break;
        case 'emails_sent':
          updateFields.status = 'emails_sent';
          if (metadata.emailStatus) {
            updateFields.emailStatus = metadata.emailStatus;
          }
          break;
        case 'under_review':
          updateFields.status = 'under_review';
          if (metadata.assignedTo) {
            updateFields.assignedTo = new ObjectId(metadata.assignedTo);
            updateFields.assignedToName = metadata.assignedToName;
          }
          break;
        case 'evidence_collected':
          updateFields.status = 'evidence_collected';
          if (metadata.policeEvidence) {
            updateFields.policeEvidence = metadata.policeEvidence;
          }
          break;
        case 'case_resolved':
          updateFields.status = 'resolved';
          if (metadata.resolutionDetails) {
            updateFields.resolutionDetails = metadata.resolutionDetails;
          }
          break;
        case 'case_closed':
          updateFields.status = 'closed';
          if (metadata.closureDetails) {
            updateFields.closureDetails = metadata.closureDetails;
          }
          break;
      }

      await this.db.collection('cases').updateOne(
        { $or: [{ _id: new ObjectId(caseId) }, { caseId: caseId }] },
        { $set: updateFields }
      );
    } catch (error) {
      console.error('Error updating case status:', error);
      throw error;
    }
  }

  // Get timeline for a case
  async getCaseTimeline(caseId) {
    try {
      const timeline = await this.db.collection('case_timeline')
        .find({ caseId: new ObjectId(caseId) })
        .sort({ createdAt: 1 })
        .toArray();

      return timeline;
    } catch (error) {
      console.error('Error getting case timeline:', error);
      throw error;
    }
  }

  // Get timeline with proper ordering
  async getOrderedTimeline(caseId) {
    try {
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

      const timeline = await this.getCaseTimeline(caseId);
      const orderedTimeline = [];

      // Add entries in proper order
      timelineOrder.forEach(stage => {
        const entry = timeline.find(t => t.stage === stage);
        if (entry) {
          orderedTimeline.push(entry);
        }
      });

      return orderedTimeline;
    } catch (error) {
      console.error('Error getting ordered timeline:', error);
      throw error;
    }
  }
}

module.exports = TimelineManager;
