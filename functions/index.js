const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// ===================================
// SUBMIT SURVEY FUNCTION
// ===================================
exports.submitSurvey = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(400).json({
        error: 'Only POST requests are allowed',
        method: req.method
      });
    }

    try {
      const submissionData = req.body;

      // Validate required fields
      if (!submissionData.userId || !submissionData.userEmail) {
        return res.status(400).json({
          error: 'Missing required fields: userId, userEmail'
        });
      }

      console.log(`📝 Processing survey submission from ${submissionData.userEmail}`);

      // Check for duplicate submission
      const existingSubmission = await db
        .collection('surveySubmissions')
        .where('userId', '==', submissionData.userId)
        .get();

      if (!existingSubmission.empty) {
        return res.status(409).json({
          error: 'User has already submitted this survey',
          submitted: true
        });
      }

      // Save to Firestore with server timestamp
      const docRef = await db.collection('surveySubmissions').add({
        userId: submissionData.userId,
        userEmail: submissionData.userEmail,
        userName: submissionData.userName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        responses: {
          q1: submissionData.q1,
          q2: submissionData.q2,
          q2a: submissionData.q2a || '',
          q3: submissionData.q3,
          q3a: submissionData.q3a || '',
          q4: submissionData.q4,
          q4a: submissionData.q4a || '',
          q5: submissionData.q5,
          q6: submissionData.q6,
          q6a: submissionData.q6a || '',
          q7: submissionData.q7 || ''
        },
        submittedAt: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      console.log(`✅ Survey saved successfully: ${docRef.id}`);

      res.json({
        success: true,
        message: 'Survey submitted successfully',
        submissionId: docRef.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error submitting survey:', error);
      res.status(500).json({
        error: 'Failed to submit survey',
        message: error.message
      });
    }
  });
});

// ===================================
// CHECK SUBMISSION FUNCTION
// ===================================
exports.checkSubmission = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(400).json({
        error: 'Only POST requests are allowed',
        method: req.method
      });
    }

    try {
      const { userId } = req.body;

      // Validate required field
      if (!userId) {
        return res.status(400).json({
          error: 'Missing required field: userId'
        });
      }

      console.log(`🔍 Checking submission status for user: ${userId}`);

      // Query Firestore for existing submission
      const snapshot = await db
        .collection('surveySubmissions')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      const hasSubmitted = !snapshot.empty;

      if (hasSubmitted) {
        const submission = snapshot.docs[0].data();
        console.log(`⚠️ User ${userId} has already submitted at ${submission.submittedAt}`);
      } else {
        console.log(`✅ User ${userId} is eligible to submit`);
      }

      res.json({
        hasSubmitted: hasSubmitted,
        userId: userId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error checking submission:', error);
      res.status(500).json({
        error: 'Failed to check submission status',
        message: error.message
      });
    }
  });
});

// ===================================
// GET SURVEY STATISTICS (Admin)
// ===================================
exports.getSurveyStats = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(400).json({error: 'Only GET requests are allowed'});
    }

    try {
      // Get total submissions count
      const snapshot = await db.collection('surveySubmissions').get();
      const totalSubmissions = snapshot.size;

      // Get submissions from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentSnapshot = await db
        .collection('surveySubmissions')
        .where('timestamp', '>=', sevenDaysAgo)
        .get();

      console.log(`📊 Survey Statistics: ${totalSubmissions} total, ${recentSnapshot.size} in last 7 days`);

      res.json({
        totalSubmissions: totalSubmissions,
        last7Days: recentSnapshot.size,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting stats:', error);
      res.status(500).json({
        error: 'Failed to get survey statistics',
        message: error.message
      });
    }
  });
});

// ===================================
// HEALTH CHECK
// ===================================
exports.healthCheck = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      region: process.env.FUNCTION_REGION || 'us-central1'
    });
  });
});

console.log('🚀 MSC Survey Cloud Functions initialized');
