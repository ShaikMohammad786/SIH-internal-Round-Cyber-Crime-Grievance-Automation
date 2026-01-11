const { MongoClient } = require('mongodb');

async function createMissingCollections() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('fraudlens');
    
    console.log('🔧 Creating missing collections...');
    
    // Create users collection
    await db.createCollection('users');
    console.log('✅ Created users collection');
    
    // Create scammers collection
    await db.createCollection('scammers');
    console.log('✅ Created scammers collection');
    
    // Create case_timeline collection
    await db.createCollection('case_timeline');
    console.log('✅ Created case_timeline collection');
    
    // Create crpc_documents collection
    await db.createCollection('crpc_documents');
    console.log('✅ Created crpc_documents collection');
    
    // Create admin_actions collection
    await db.createCollection('admin_actions');
    console.log('✅ Created admin_actions collection');
    
    // Create admin_comments collection
    await db.createCollection('admin_comments');
    console.log('✅ Created admin_comments collection');
    
    // Create case_evidence collection
    await db.createCollection('case_evidence');
    console.log('✅ Created case_evidence collection');
    
    console.log('\n🎉 All missing collections created successfully!');
    
    // Verify collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 All collections now:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
  } catch (error) {
    console.error('❌ Error creating collections:', error);
  } finally {
    await client.close();
  }
}

createMissingCollections();
