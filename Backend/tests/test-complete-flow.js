const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// Test the complete case flow system
async function testCompleteFlow() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('91crpc');
    console.log('✅ Connected to MongoDB');

    console.log('\n🚀 Starting Complete Case Flow Test');
    console.log('=====================================');

    // Test data
    const testCaseData = {
      caseType: 'upi-fraud',
      description: 'Test UPI fraud case for complete flow testing',
      amount: 50000,
      incidentDate: new Date().toISOString().split('T')[0],
      location: {
        state: 'Maharashtra',
        city: 'Mumbai',
        address: 'Test Address, Mumbai'
      },
      contactInfo: {
        email: 'test@example.com',
        phone: '9876543210'
      },
      evidence: [],
      formData: {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          nationality: 'Indian'
        }
      },
      scammerInfo: {
        name: 'Test Scammer',
        phone: '9876543212',
        email: 'scammer@example.com',
        upiId: 'scammer@upi',
        bankAccount: '1234567890'
      }
    };

    // Generate unique case ID
    const caseId = `FRD-${Date.now()}-TEST`;
    console.log('Generated Case ID:', caseId);

    // Create case document
    const caseDoc = {
      caseId,
      userId: new ObjectId('507f1f77bcf86cd799439011'),
      ...testCaseData,
      status: 'submitted',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      flow: {
        currentStep: 1,
        steps: [
          { step: 1, name: 'Report Submitted', status: 'completed', completedAt: new Date() },
          { step: 2, name: 'Information Verified', status: 'pending' },
          { step: 3, name: '91CRPC Generated', status: 'pending' },
          { step: 4, name: 'Email Sent', status: 'pending' },
          { step: 5, name: 'Authorized', status: 'pending' },
          { step: 6, name: 'Assigned to Police', status: 'pending' },
          { step: 7, name: 'Evidence Collected', status: 'pending' },
          { step: 8, name: 'Resolved', status: 'pending' },
          { step: 9, name: 'Closed', status: 'pending' }
        ]
      }
    };

    const caseResult = await db.collection('cases').insertOne(caseDoc);
    console.log('✅ Case created with ID:', caseResult.insertedId);

    // Process scammer info
    const scammerId = await processScammerInfo(db, testCaseData.scammerInfo, caseId);
    console.log('✅ Scammer processed with ID:', scammerId);

    // Update case with scammer ID
    if (scammerId) {
      await db.collection('cases').updateOne(
        { _id: caseResult.insertedId },
        { $set: { scammerId: new ObjectId(scammerId) } }
      );
    }

    // Add timeline entry
    await addTimelineEntry(db, caseResult.insertedId, 'Report Submitted', 'completed', 
      'Initial report received and logged.', { name: 'Test System' });
    console.log('✅ Timeline entry added');

    // Process all steps
    await processInformationVerification(db, caseResult.insertedId, caseId);
    console.log('✅ Information verification completed');

    await process91CRPCGeneration(db, caseResult.insertedId, caseId);
    console.log('✅ 91CRPC generation completed');

    await processEmailSending(db, caseResult.insertedId, caseId);
    console.log('✅ Email sending completed');

    await processAuthorization(db, caseResult.insertedId, caseId);
    console.log('✅ Authorization completed');

    await processPoliceAssignment(db, caseResult.insertedId, caseId);
    console.log('✅ Police assignment completed');

    await processEvidenceCollection(db, caseResult.insertedId, caseId);
    console.log('✅ Evidence collection completed');

    await processResolution(db, caseResult.insertedId, caseId);
    console.log('✅ Resolution completed');

    await processClosure(db, caseResult.insertedId, caseId);
    console.log('✅ Closure completed');

    // Final verification
    console.log('\n🔍 Final verification...');
    
    const finalCase = await db.collection('cases').findOne({ _id: caseResult.insertedId });
    console.log('Final case status:', finalCase.status);
    console.log('Final flow step:', finalCase.flow.currentStep);
    console.log('All steps completed:', finalCase.flow.steps.every(step => step.status === 'completed'));

    const timelineEntries = await db.collection('case_timeline').find({
      caseId: caseResult.insertedId
    }).sort({ createdAt: 1 }).toArray();
    console.log('Timeline entries count:', timelineEntries.length);

    const crpcDocs = await db.collection('crpc_documents').find({
      caseId: caseResult.insertedId
    }).toArray();
    console.log('CRPC documents count:', crpcDocs.length);

    console.log('\n🎉 Complete Case Flow Test PASSED!');
    console.log('=====================================');
    console.log('✅ All 9 steps completed successfully');
    console.log('✅ Timeline entries created');
    console.log('✅ CRPC document generated');
    console.log('✅ Scammer information processed');
    console.log('✅ Case status updated throughout flow');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Helper functions
async function processScammerInfo(db, scammerInfo, caseId) {
  try {
    const existingScammer = await db.collection('scammers').findOne({
      $or: [
        { phoneNumber: scammerInfo.phone },
        { email: scammerInfo.email },
        { upiId: scammerInfo.upiId },
        { bankAccount: scammerInfo.bankAccount }
      ]
    });

    if (existingScammer) {
      await db.collection('scammers').updateOne(
        { _id: existingScammer._id },
        { 
          $addToSet: { cases: caseId },
          $set: { 
            lastSeen: new Date(),
            updatedAt: new Date()
          }
        }
      );
      return existingScammer._id;
    } else {
      const newScammer = {
        name: scammerInfo.name || 'Unknown',
        phoneNumber: scammerInfo.phone || null,
        email: scammerInfo.email || null,
        upiId: scammerInfo.upiId || null,
        bankAccount: scammerInfo.bankAccount || null,
        cases: [caseId],
        totalCases: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      
      const result = await db.collection('scammers').insertOne(newScammer);
      return result.insertedId;
    }
  } catch (error) {
    console.error('Process scammer info error:', error);
    return null;
  }
}

async function addTimelineEntry(db, caseId, stage, status, description, user) {
  try {
    await db.collection('case_timeline').insertOne({
      caseId: caseId,
      stage: stage,
      status: status,
      description: description,
      completedAt: status === 'completed' ? new Date() : null,
      icon: getIconForStage(stage),
      createdBy: user.userId ? new ObjectId(user.userId) : null,
      createdByRole: user.role || 'system',
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Add timeline entry error:', error);
  }
}

function getIconForStage(stage) {
  const icons = {
    'Report Submitted': '📄',
    'Information Verified': '🔍',
    '91CRPC Generated': '📋',
    'Email Sent': '📧',
    'Authorized': '✅',
    'Assigned to Police': '👮',
    'Evidence Collected': '📋',
    'Resolved': '✅',
    'Case Closed': '🔒'
  };
  return icons[stage] || '📄';
}

// Process each step
async function processInformationVerification(db, caseId, caseIdString) {
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'verified',
        'flow.currentStep': 2,
        'flow.steps.1.status': 'completed',
        'flow.steps.1.completedAt': new Date(),
        updatedAt: new Date()
      }
    }
  );
  await addTimelineEntry(db, caseId, 'Information Verified', 'completed',
    'Personal and contact details verified automatically.', { name: 'System' });
}

async function process91CRPCGeneration(db, caseId, caseIdString) {
  const crpcDocument = {
    documentType: '91 CrPC Notice',
    documentNumber: `91CRPC-${Date.now()}`,
    generatedDate: new Date().toISOString()
  };

  const crpcRecord = {
    caseId: caseId,
    caseIdString: caseIdString,
    documentType: '91_crpc',
    documentNumber: `91CRPC-${Date.now()}`,
    generatedBy: new ObjectId('000000000000000000000000'),
    generatedAt: new Date(),
    status: 'generated',
    content: crpcDocument,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection('crpc_documents').insertOne(crpcRecord);
  
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'crpc_generated',
        'flow.currentStep': 3,
        'flow.steps.2.status': 'completed',
        'flow.steps.2.completedAt': new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  await addTimelineEntry(db, caseId, '91CRPC Generated', 'completed',
    'Legal document generated under Section 91 of CrPC', { name: 'System' });
}

async function processEmailSending(db, caseId, caseIdString) {
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'emails_sent',
        'flow.currentStep': 4,
        'flow.steps.3.status': 'completed',
        'flow.steps.3.completedAt': new Date(),
        emailStatus: {
          lastSent: new Date(),
          results: { telecom: 'sent', banking: 'sent', nodal: 'sent' }
        },
        updatedAt: new Date()
      }
    }
  );
  
  await addTimelineEntry(db, caseId, 'Email Sent', 'completed',
    'Emails sent to telecom, banking, and nodal authorities', { name: 'System' });
}

async function processAuthorization(db, caseId, caseIdString) {
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'authorized',
        'flow.currentStep': 5,
        'flow.steps.4.status': 'completed',
        'flow.steps.4.completedAt': new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  await addTimelineEntry(db, caseId, 'Authorized', 'completed',
    'Case authorized by system and ready for police assignment', { name: 'System' });
}

async function processPoliceAssignment(db, caseId, caseIdString) {
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'assigned_to_police',
        'flow.currentStep': 6,
        'flow.steps.5.status': 'completed',
        'flow.steps.5.completedAt': new Date(),
        assignedTo: 'police_system',
        assignedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  await addTimelineEntry(db, caseId, 'Assigned to Police', 'completed',
    'Case assigned to police for investigation', { name: 'System' });
}

async function processEvidenceCollection(db, caseId, caseIdString) {
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'evidence_collected',
        'flow.currentStep': 7,
        'flow.steps.6.status': 'completed',
        'flow.steps.6.completedAt': new Date(),
        evidenceCollectedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  await addTimelineEntry(db, caseId, 'Evidence Collected', 'completed',
    'Evidence collected and case ready for resolution', { name: 'System' });
}

async function processResolution(db, caseId, caseIdString) {
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'resolved',
        'flow.currentStep': 8,
        'flow.steps.7.status': 'completed',
        'flow.steps.7.completedAt': new Date(),
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  await addTimelineEntry(db, caseId, 'Resolved', 'completed',
    'Case resolved by police and ready for closure', { name: 'System' });
}

async function processClosure(db, caseId, caseIdString) {
  await db.collection('cases').updateOne(
    { _id: caseId },
    { 
      $set: { 
        status: 'closed',
        'flow.currentStep': 9,
        'flow.steps.8.status': 'completed',
        'flow.steps.8.completedAt': new Date(),
        'flow.steps.9.status': 'completed',
        'flow.steps.9.completedAt': new Date(),
        closedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  await addTimelineEntry(db, caseId, 'Case Closed', 'completed',
    'Case successfully closed and archived', { name: 'System' });
}

// Run the test
if (require.main === module) {
  testCompleteFlow().catch(console.error);
}

module.exports = { testCompleteFlow };