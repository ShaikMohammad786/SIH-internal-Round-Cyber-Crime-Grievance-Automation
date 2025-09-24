const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const client = new MongoClient(MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    const db = client.db("91crpc");
    
    // Test the connection
    await db.admin().ping();
    console.log("Connected to MongoDB successfully");
    
    // Set up error handling for connection
    client.on('error', (error) => {
      console.error('MongoDB client error:', error);
    });
    
    client.on('close', () => {
      console.log('MongoDB connection closed');
    });
    
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.error("Please ensure MongoDB is running and accessible");
    process.exit(1);
  }
}

// Import routes
const { authRouter } = require('./routes/auth');
const casesRouter = require('./routes/cases');
const { adminRouter } = require('./routes/admin');
const policeRouter = require('./routes/police');
const { userProfilesRouter } = require('./routes/userProfiles');
const scammersRouter = require('./routes/scammers');
const emailRouter = require('./routes/email');
const emailConfigRouter = require('./routes/emailConfig');
const timelineRouter = require('./routes/timeline');
const crpcGeneratorRouter = require('./routes/crpcGenerator');
const adminActionsRouter = require('./routes/adminActions');
const caseFlowRouter = require('./routes/caseFlow');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/police', policeRouter);
app.use('/api/user', userProfilesRouter);
app.use('/api/scammers', scammersRouter);
app.use('/api/email', emailRouter);
app.use('/api/email-config', emailConfigRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/crpc', crpcGeneratorRouter);
app.use('/api/admin-actions', adminActionsRouter);
app.use('/api/case-flow', caseFlowRouter);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Start server
async function startServer() {
  const db = await connectToDatabase();
  app.locals.db = db; // Make db available to routes
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch(console.error);