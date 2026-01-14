/**
 * Firebase Configuration for Site-Wide Search Tracking
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (free plan)
 * 3. Enable Realtime Database
 * 4. Replace the config values below with your project's credentials
 * 5. Set database rules (see FIREBASE_SETUP.md)
 */

// Firebase configuration - REPLACE WITH YOUR VALUES
const firebaseConfig = {
  apiKey: "AIzaSyAjSIoCBQlqSJwMj-cqd7uI_MxIsg0mk1M",
  authDomain: "alfredmayaki-searches.firebaseapp.com",
  databaseURL: "https://alfredmayaki-searches-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "alfredmayaki-searches",
  storageBucket: "alfredmayaki-searches.firebasestorage.app",
  messagingSenderId: "498678898036",
  appId: "1:498678898036:web:586df6d432da2d6aa92021"
};

// Initialize Firebase (will be called from index.html)
let firebaseApp = null;
let database = null;

function initFirebase() {
  if (!window.firebase) {
    console.warn('Firebase SDK not loaded');
    return false;
  }
  
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return false;
  }
}

/**
 * Track search in Firebase
 * @param {string} query - The search query
 * @param {Object} keywords - Extracted keywords with counts
 */
async function trackSearchFirebase(query, keywords) {
  if (!database) {
    console.warn('Firebase not initialized, tracking locally only');
    return;
  }
  
  try {
    // Track individual search
    const searchRef = database.ref('searches');
    await searchRef.push({
      query: query,
      timestamp: Date.now(),
      // Optional: Add user metadata (anonymized)
      userAgent: navigator.userAgent,
      language: navigator.language,
      referrer: document.referrer || 'direct'
    });
    
    // Update keyword counts
    const keywordsRef = database.ref('keywords');
    const updates = {};
    
    for (const [word, count] of Object.entries(keywords)) {
      // Use transaction to safely increment counts
      const wordRef = keywordsRef.child(word);
      const snapshot = await wordRef.once('value');
      const currentCount = snapshot.val() || 0;
      updates[word] = currentCount + count;
    }
    
    await keywordsRef.update(updates);
    console.log('✅ Search tracked in Firebase');
    
  } catch (error) {
    console.error('Error tracking search:', error);
  }
}

/**
 * Get aggregated search data
 * @param {number} limit - Number of top keywords to return
 * @returns {Promise<Object>} Aggregated search data
 */
async function getAggregatedSearchData(limit = 50) {
  if (!database) {
    return { keywords: {}, totalSearches: 0, recentSearches: [] };
  }
  
  try {
    // Get keywords
    const keywordsSnapshot = await database.ref('keywords')
      .orderByValue()
      .limitToLast(limit)
      .once('value');
    
    const keywords = keywordsSnapshot.val() || {};
    
    // Get total search count
    const searchesSnapshot = await database.ref('searches').once('value');
    const totalSearches = searchesSnapshot.numChildren();
    
    // Get recent searches (last 20)
    const recentSnapshot = await database.ref('searches')
      .orderByChild('timestamp')
      .limitToLast(20)
      .once('value');
    
    const recentSearches = [];
    recentSnapshot.forEach(child => {
      recentSearches.push(child.val());
    });
    
    return {
      keywords: keywords,
      totalSearches: totalSearches,
      recentSearches: recentSearches.reverse() // Most recent first
    };
    
  } catch (error) {
    console.error('Error fetching aggregated data:', error);
    return { keywords: {}, totalSearches: 0, recentSearches: [] };
  }
}

/**
 * Get search analytics
 * @returns {Promise<Object>} Analytics data
 */
async function getSearchAnalytics() {
  if (!database) return null;
  
  try {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Searches in last 24 hours
    const last24h = await database.ref('searches')
      .orderByChild('timestamp')
      .startAt(oneDayAgo)
      .once('value');
    
    // Searches in last 7 days
    const last7d = await database.ref('searches')
      .orderByChild('timestamp')
      .startAt(oneWeekAgo)
      .once('value');
    
    return {
      searchesLast24h: last24h.numChildren(),
      searchesLast7d: last7d.numChildren(),
      avgSearchesPerDay: Math.round(last7d.numChildren() / 7)
    };
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

// Export functions for use in other files
window.FirebaseSearchTracking = {
  initFirebase,
  trackSearchFirebase,
  getAggregatedSearchData,
  getSearchAnalytics
};
