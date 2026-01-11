const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017/91crpc";
const client = new MongoClient(uri);

async function debugCases() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    
    // Check cases collection
    const casesCount = await db.collection('cases').countDocuments();
    console.log(`\n📊 Total cases in database: ${casesCount}`);
    
    if (casesCount > 0) {
      console.log("\n📋 Sample cases:");
      const sampleCases = await db.collection('cases').find({}).limit(5).toArray();
      sampleCases.forEach((caseDoc, index) => {
        console.log(`\nCase ${index + 1}:`);
        console.log(`- ID: ${caseDoc._id}`);
        console.log(`- Case ID: ${caseDoc.caseId}`);
        console.log(`- User ID: ${caseDoc.userId}`);
        console.log(`- Status: ${caseDoc.status}`);
        console.log(`- Type: ${caseDoc.caseType}`);
        console.log(`- Amount: ${caseDoc.amount}`);
        console.log(`- Created: ${caseDoc.createdAt}`);
      });
    }
    
    // Check users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`\n👥 Total users in database: ${usersCount}`);
    
    if (usersCount > 0) {
      console.log("\n👤 Sample users:");
      const sampleUsers = await db.collection('users').find({}).limit(3).toArray();
      sampleUsers.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`- ID: ${user._id}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Role: ${user.role}`);
      });
    }
    
    // Check userProfiles collection
    const profilesCount = await db.collection('userProfiles').countDocuments();
    console.log(`\n📝 Total user profiles: ${profilesCount}`);
    
    // Check case_timeline collection
    const timelineCount = await db.collection('case_timeline').countDocuments();
    console.log(`\n⏰ Total timeline entries: ${timelineCount}`);

  } catch (error) {
    console.error("Error debugging cases:", error);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

debugCases();
