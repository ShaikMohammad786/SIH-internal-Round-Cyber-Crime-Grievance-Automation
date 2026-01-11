const { MongoClient, ObjectId } = require('mongodb');

async function testCRPCDocuments() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('91crpc');
    
    console.log('🔍 Checking CRPC documents...');
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check crpc_documents collection
    const crpcDocs = await db.collection('crpc_documents').find({}).toArray();
    console.log(`\n📋 CRPC Documents found: ${crpcDocs.length}`);
    
    crpcDocs.forEach((doc, index) => {
      console.log(`\n${index + 1}. Document ID: ${doc._id}`);
      console.log(`   Document Number: ${doc.documentNumber}`);
      console.log(`   Case ID: ${doc.caseIdString}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Generated At: ${doc.generatedAt}`);
      console.log(`   Recipients: ${JSON.stringify(doc.recipients, null, 2)}`);
    });
    
    // Check cases collection
    const cases = await db.collection('cases').find({}).sort({createdAt: -1}).limit(3).toArray();
    console.log(`\n📄 Recent Cases found: ${cases.length}`);
    
    cases.forEach((caseDoc, index) => {
      console.log(`\n${index + 1}. Case ID: ${caseDoc.caseId}`);
      console.log(`   Case ObjectId: ${caseDoc._id}`);
      console.log(`   Status: ${caseDoc.status}`);
      console.log(`   Created At: ${caseDoc.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testCRPCDocuments();
