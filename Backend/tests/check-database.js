const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Check all databases
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    console.log('📋 Available databases:', dbs.databases.map(db => db.name));
    
    // Check fraudlens database
    const db = client.db('fraudlens');
    const crpcDocs = await db.collection('crpc_documents').find({}).toArray();
    console.log('📄 CRPC documents in fraudlens:', crpcDocs.length);
    
    if (crpcDocs.length > 0) {
      crpcDocs.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.documentNumber} - ${doc.status}`);
      });
    }
    
    // Check cases
    const cases = await db.collection('cases').find({}).toArray();
    console.log('📄 Cases in fraudlens:', cases.length);
    
    if (cases.length > 0) {
      cases.forEach((caseDoc, index) => {
        console.log(`${index + 1}. ${caseDoc.caseId} - ${caseDoc.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
