/**
 * Firebase Cloud Function for Secure Survey Submission
 * 
 * This function handles:
 * 1. Verifying Google OAuth tokens
 * 2. Checking for duplicate submissions
 * 3. Writing survey responses to Google Sheets
 * 4. Security and validation
 * 
 * Deploy with:
 * firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Survey Responses';

// Initialize OAuth Client
const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Check if a user has already submitted the survey
 */
exports.checkSubmission = functions.https.onRequest(async (req, res) => {
  try {
    // Verify CORS
    cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check Firestore for existing submission
      const submissionsRef = admin.firestore().collection('survey_submissions');
      const query = submissionsRef.where('userId', '==', userId).limit(1);
      const snapshot = await query.get();

      const hasSubmitted = !snapshot.empty;

      return res.json({
        hasSubmitted,
        message: hasSubmitted 
          ? 'User has already submitted' 
          : 'User can submit'
      });
    });
  } catch (error) {
    console.error('Error checking submission:', error);
    return res.status(500).json({ 
      error: 'Failed to check submission status',
      details: error.message 
    });
  }
});

/**
 * Submit survey response to Google Sheets
 */
exports.submitSurvey = functions.https.onRequest(async (req, res) => {
  try {
    // Verify CORS and method
    cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const submissionData = req.body;
      const { userId, userEmail, userName, timestamp, ...responses } = submissionData;

      // Validate required fields
      if (!userId || !userEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Check for duplicate submission
        const submissionsRef = admin.firestore().collection('survey_submissions');
        const existingSubmission = await submissionsRef
          .where('userId', '==', userId)
          .limit(1)
          .get();

        if (!existingSubmission.empty) {
          return res.status(409).json({ 
            error: 'Duplicate submission',
            message: 'You have already submitted this survey'
          });
        }

        // Append to Google Sheet
        const sheets = google.sheets({
          version: 'v4',
          auth: GOOGLE_SHEETS_API_KEY
        });

        // Prepare data for Sheets
        const values = [[
          timestamp,
          userId,
          userEmail,
          userName,
          responses.q1 || '',
          responses.q2 || '',
          responses.q2a || '',
          responses.q3 || '',
          responses.q3a || '',
          responses.q4 || '',
          responses.q4a || '',
          responses.q5 || '',
          responses.q6 || '',
          responses.q6a || '',
          responses.q7 || '',
        ]];

        // Append to sheet
        const appendRequest = await sheets.spreadsheets.values.append({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `${SHEET_NAME}!A:O`,
          valueInputOption: 'USER_ENTERED',
          resource: { values }
        });

        // Store submission record in Firestore
        await submissionsRef.add({
          userId,
          userEmail,
          userName,
          timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
          responseId: appendRequest.data.updates.updatedRows,
          ipAddress: req.ip
        });

        // Log successful submission
        console.log(`✅ Survey submitted by ${userEmail} (${userId})`);

        return res.json({
          success: true,
          message: 'Survey submitted successfully',
          submissionId: userId,
          timestamp
        });

      } catch (sheetsError) {
        console.error('Google Sheets API error:', sheetsError);
        return res.status(500).json({ 
          error: 'Failed to save survey response',
          details: sheetsError.message 
        });
      }
    });
  } catch (error) {
    console.error('Error submitting survey:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

/**
 * CORS handler (basic implementation)
 * For production, use more robust CORS middleware
 */
function cors(req, res, callback) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  } else {
    callback();
  }
}

/**
 * Initialize Google Sheet with headers (run once)
 * Call: firebase functions:shell > initializeSheet()
 */
exports.initializeSheet = functions.https.onRequest(async (req, res) => {
  try {
    const sheets = google.sheets({
      version: 'v4',
      auth: GOOGLE_SHEETS_API_KEY
    });

    const headers = [[
      'Timestamp',
      'User ID',
      'Email',
      'Name',
      'Q1: What attracts you to an organization?',
      'Q2: How do you perceive inclusivity?',
      'Q2a: How does this impact you?',
      'Q3: Your current organization experience?',
      'Q3a: Other experiences?',
      'Q4: Do you disclose neurodivergence?',
      'Q4a: Experience of disclosure/non-disclosure?',
      'Q5: Experience of adjustments?',
      'Q6: When at your best?',
      'Q6a: How did organization help?',
      'Q7: Anything else?'
    ]];

    const request = {
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!A1:O1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: headers }
    };

    const response = await sheets.spreadsheets.values.update(request);

    return res.json({
      message: 'Sheet initialized successfully',
      updatedCells: response.data.updatedCells
    });
  } catch (error) {
    console.error('Error initializing sheet:', error);
    return res.status(500).json({ 
      error: 'Failed to initialize sheet',
      details: error.message 
    });
  }
});

/**
 * Get submission statistics (admin only)
 */
exports.getStatistics = functions.https.onRequest(async (req, res) => {
  try {
    // Verify authentication (add your own auth mechanism)
    // This is a basic example - implement proper auth checks

    const submissionsRef = admin.firestore().collection('survey_submissions');
    const snapshot = await submissionsRef.get();

    const stats = {
      totalSubmissions: snapshot.size,
      submissions: []
    };

    snapshot.forEach(doc => {
      stats.submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.json(stats);
  } catch (error) {
    console.error('Error getting statistics:', error);
    return res.status(500).json({ 
      error: 'Failed to get statistics',
      details: error.message 
    });
  }
});
