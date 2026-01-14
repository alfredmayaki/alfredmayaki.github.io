/**
 * INSTRUCTIONS TO USE CLOUDFLARE WORKER PROXY
 * 
 * Follow these steps to bypass CORS restrictions:
 * 
 * STEP 1: DEPLOY THE WORKER
 * ─────────────────────────────────────────────────────────────────────
 * 1. Go to: https://dash.cloudflare.com
 * 2. Navigate to: Workers & Pages
 * 3. Click: "Create Application" → "Create Worker"
 * 4. Name it: "analytics-proxy" (or any name you prefer)
 * 5. Click: "Deploy"
 * 6. Click: "Edit Code"
 * 7. Copy and paste the code from 'cloudflare-worker-proxy.js'
 * 8. Click: "Save and Deploy"
 * 9. Copy your Worker URL (e.g., https://analytics-proxy.your-subdomain.workers.dev)
 * 
 * STEP 2: UPDATE REPORT.HTML
 * ─────────────────────────────────────────────────────────────────────
 * In report.html, find the fetchCloudflareAnalytics() function and change:
 * 
 *   FROM:
 *   const restUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}&continuous=true`;
 * 
 *   TO:
 *   const workerUrl = 'https://YOUR-WORKER-URL.workers.dev'; // Your worker URL here
 *   const restUrl = `${workerUrl}?since=${since}&until=${until}`;
 * 
 * AND update the fetch call headers:
 * 
 *   const response = await fetch(restUrl, {
 *     method: 'GET',
 *     headers: {
 *       'Authorization': `Bearer ${apiToken}`,
 *       'X-Zone-ID': zoneId,  // Add this line
 *       'Content-Type': 'application/json'
 *     }
 *   });
 * 
 * STEP 3: TEST
 * ─────────────────────────────────────────────────────────────────────
 * 1. Open report.html in your browser
 * 2. Enter your API Token and Zone ID
 * 3. Click "Fetch Analytics"
 * 4. Data should now load without CORS errors!
 * 
 * SECURITY TIPS
 * ─────────────────────────────────────────────────────────────────────
 * 1. In production, change the CORS_HEADERS 'Access-Control-Allow-Origin'
 *    from '*' to your specific domain:
 *    'Access-Control-Allow-Origin': 'https://alfredmayaki.github.io'
 * 
 * 2. Add rate limiting to prevent abuse (see optional code in worker)
 * 
 * 3. Consider adding IP whitelisting if you have a static IP
 * 
 * 4. Monitor your worker usage in the Cloudflare dashboard
 * 
 * TROUBLESHOOTING
 * ─────────────────────────────────────────────────────────────────────
 * If you still get errors:
 * 
 * 1. Check worker logs: Workers & Pages → Your Worker → Logs
 * 2. Verify API token permissions include "Analytics:Read"
 * 3. Confirm Zone ID is correct
 * 4. Check browser console (F12) for detailed errors
 * 5. Test worker directly: https://YOUR-WORKER-URL.workers.dev
 * 
 * FREE TIER LIMITS
 * ─────────────────────────────────────────────────────────────────────
 * Cloudflare Workers Free Plan includes:
 * - 100,000 requests per day
 * - 10ms CPU time per request
 * - This is more than enough for personal analytics dashboard!
 * 
 * ALTERNATIVE: LOCAL DEVELOPMENT
 * ─────────────────────────────────────────────────────────────────────
 * For local testing, you can:
 * 1. Install Wrangler CLI: npm install -g wrangler
 * 2. Login: wrangler login
 * 3. Test locally: wrangler dev cloudflare-worker-proxy.js
 * 4. Access at: http://localhost:8787
 */

// Quick reference code snippets:

// ═══════════════════════════════════════════════════════════════════════
// SNIPPET 1: Modified fetch function for report.html
// ═══════════════════════════════════════════════════════════════════════
/*
async function fetchCloudflareAnalytics() {
  const apiToken = document.getElementById('apiToken').value.trim();
  const zoneId = document.getElementById('zoneId').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!apiToken || !zoneId) {
    showAlert('Please provide API Token and Zone ID', 'warning');
    return;
  }

  const fetchBtn = document.getElementById('fetchDataBtn');
  fetchBtn.disabled = true;
  fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

  try {
    // ★ CHANGE THIS TO YOUR WORKER URL ★
    const workerUrl = 'https://analytics-proxy.YOUR-SUBDOMAIN.workers.dev';
    
    const url = `${workerUrl}?since=${startDate}&until=${endDate}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'X-Zone-ID': zoneId,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'API request failed');
    }

    processAndDisplayRestData(data.result);
    showAlert('Analytics loaded successfully!', 'success');

  } catch (error) {
    console.error('Error:', error);
    showAlert(`Failed to fetch: ${error.message}`, 'error');
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.innerHTML = '<i class="fas fa-chart-line"></i> Fetch Analytics';
  }
}
*/

// ═══════════════════════════════════════════════════════════════════════
// SNIPPET 2: Testing your worker with curl
// ═══════════════════════════════════════════════════════════════════════
/*
# Replace with your actual values:
curl -X GET "https://YOUR-WORKER-URL.workers.dev?since=2024-01-01&until=2024-01-28" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "X-Zone-ID: YOUR_ZONE_ID"
*/

// ═══════════════════════════════════════════════════════════════════════
// SNIPPET 3: Adding domain restriction to worker (production)
// ═══════════════════════════════════════════════════════════════════════
/*
// In cloudflare-worker-proxy.js, replace CORS_HEADERS with:
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://alfredmayaki.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Zone-ID',
  'Access-Control-Max-Age': '86400',
};
*/
