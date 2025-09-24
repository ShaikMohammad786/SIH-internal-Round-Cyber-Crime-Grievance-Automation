const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/91crpc';

async function cleanupTimeline() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db("91crpc");
    
    console.log('🔍 Starting timeline cleanup...');
    
    // Get all cases
    const cases = await db.collection('cases').find({}).toArray();
    console.log(`Found ${cases.length} cases to process`);
    
    for (const caseDoc of cases) {
      console.log(`\n📋 Processing case: ${caseDoc.caseId}`);
      
      // Get all timeline entries for this case
      const timelineEntries = await db.collection('case_timeline')
        .find({ caseId: caseDoc._id })
        .sort({ createdAt: 1 })
        .toArray();
      
      console.log(`  Found ${timelineEntries.length} timeline entries`);
      
      if (timelineEntries.length === 0) {
        // Create initial timeline entry if none exists
        const initialEntry = {
          caseId: caseDoc._id,
          stage: 'report_submitted',
          stageName: 'Report Submitted',
          description: 'Initial fraud report received and logged',
          icon: '📄',
          userVisible: true,
          createdBy: caseDoc.userId,
          createdByRole: 'user',
          createdAt: caseDoc.createdAt,
          updatedAt: caseDoc.createdAt,
          metadata: {
            caseId: caseDoc.caseId,
            caseType: caseDoc.caseType,
            amount: caseDoc.amount
          }
        };
        
        await db.collection('case_timeline').insertOne(initialEntry);
        console.log(`  ✅ Created initial timeline entry`);
        continue;
      }
      
      // Remove duplicates - keep only the first occurrence of each stage
      const uniqueEntries = [];
      const seenStages = new Set();
      
      for (const entry of timelineEntries) {
        if (!seenStages.has(entry.stage)) {
          uniqueEntries.push(entry);
          seenStages.add(entry.stage);
        } else {
          console.log(`  🗑️  Removing duplicate entry for stage: ${entry.stage}`);
        }
      }
      
      // Delete all timeline entries for this case
      await db.collection('case_timeline').deleteMany({ caseId: caseDoc._id });
      
      // Re-insert unique entries
      if (uniqueEntries.length > 0) {
        await db.collection('case_timeline').insertMany(uniqueEntries);
        console.log(`  ✅ Cleaned up timeline: ${timelineEntries.length} → ${uniqueEntries.length} entries`);
      }
      
      // Update case status based on latest timeline entry
      if (uniqueEntries.length > 0) {
        const latestEntry = uniqueEntries[uniqueEntries.length - 1];
        const statusMap = {
          'report_submitted': 'submitted',
          'information_verified': 'verified',
          'crpc_generated': 'crpc_generated',
          'emails_sent': 'emails_sent',
          'under_investigation': 'under_review',
          'evidence_collected': 'evidence_collected',
          'resolved': 'resolved',
          'closed': 'closed',
          'rejected': 'rejected'
        };
        
        const newStatus = statusMap[latestEntry.stage] || caseDoc.status;
        if (newStatus !== caseDoc.status) {
          await db.collection('cases').updateOne(
            { _id: caseDoc._id },
            { 
              $set: { 
                status: newStatus,
                updatedAt: new Date()
              }
            }
          );
          console.log(`  🔄 Updated case status: ${caseDoc.status} → ${newStatus}`);
        }
      }
    }
    
    console.log('\n✅ Timeline cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during timeline cleanup:', error);
  } finally {
    await client.close();
  }
}

// Run cleanup
cleanupTimeline().catch(console.error);
