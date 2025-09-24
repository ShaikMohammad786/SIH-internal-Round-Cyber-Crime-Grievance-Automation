const { MongoClient } = require('mongodb');

async function check91CrPCDatabase() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Check 91crpc database
    const db = client.db('91crpc');
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections in 91crpc database:', collections.map(c => c.name));
    
    // Check crpc_documents collection
    const crpcDocs = await db.collection('crpc_documents').find({}).toArray();
    console.log('📄 CRPC documents in 91crpc:', crpcDocs.length);
    
    if (crpcDocs.length > 0) {
      crpcDocs.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.documentNumber} - ${doc.status}`);
        console.log(`   Case ID: ${doc.caseIdString}`);
        console.log(`   Generated: ${doc.generatedAt}`);
        console.log(`   Recipients: ${JSON.stringify(doc.recipients, null, 2)}`);
        console.log('   ---');
      });
    }
    
    // Check cases collection
    const cases = await db.collection('cases').find({}).toArray();
    console.log('📄 Cases in 91crpc:', cases.length);
    
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

check91CrPCDatabase();
