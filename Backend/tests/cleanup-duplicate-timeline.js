const { MongoClient } = require('mongodb');

// Database cleanup script to remove duplicate timeline entries
async function cleanupDuplicateTimeline() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Starting timeline cleanup...');
    
    // Get all cases
    const cases = await db.collection('cases').find({}).toArray();
    console.log(`Found ${cases.length} cases to process`);
    
    for (const caseDoc of cases) {
      console.log(`Processing case: ${caseDoc.caseId}`);
      
      // Get all timeline entries for this case
      const timelineEntries = await db.collection('case_timeline').find({ 
        caseId: caseDoc._id 
      }).sort({ createdAt: 1 }).toArray();
      
      if (timelineEntries.length <= 6) {
        console.log(`  Case ${caseDoc.caseId} has ${timelineEntries.length} entries - no cleanup needed`);
        continue;
      }
      
      // Group by stage to find duplicates
      const stageGroups = {};
      timelineEntries.forEach(entry => {
        if (!stageGroups[entry.stage]) {
          stageGroups[entry.stage] = [];
        }
        stageGroups[entry.stage].push(entry);
      });
      
      // Keep only the latest entry for each stage
      const entriesToKeep = [];
      const entriesToDelete = [];
      
      Object.keys(stageGroups).forEach(stage => {
        const entries = stageGroups[stage];
        if (entries.length > 1) {
          // Sort by createdAt descending to get the latest
          entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          entriesToKeep.push(entries[0]);
          entriesToDelete.push(...entries.slice(1));
        } else {
          entriesToKeep.push(entries[0]);
        }
      });
      
      if (entriesToDelete.length > 0) {
        console.log(`  Case ${caseDoc.caseId}: Removing ${entriesToDelete.length} duplicate entries`);
        
        // Delete duplicate entries
        const deleteIds = entriesToDelete.map(entry => entry._id);
        await db.collection('case_timeline').deleteMany({
          _id: { $in: deleteIds }
        });
        
        console.log(`  Case ${caseDoc.caseId}: Cleaned up successfully`);
      }
    }
    
    console.log('Timeline cleanup completed!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDuplicateTimeline();
}

module.exports = cleanupDuplicateTimeline;
