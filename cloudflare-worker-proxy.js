/**
 * Cloudflare Worker Proxy for Analytics API
 * 
 * This worker acts as a CORS-friendly proxy between your frontend and Cloudflare's Analytics API.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Cloudflare Dashboard → Workers & Pages
 * 2. Click "Create Application" → "Create Worker"
 * 3. Replace the default code with this script
 * 4. Click "Save and Deploy"
 * 5. Copy your worker URL (e.g., https://analytics-proxy.your-subdomain.workers.dev)
 * 6. Update report.html to use this worker URL instead of the direct API
 * 
 * SECURITY NOTE:
 * - This worker should validate requests from your domain only
 * - Consider adding rate limiting
 * - Store sensitive data in Worker environment variables
 */

// CORS headers for your frontend
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Change to your domain in production: 'https://alfredmayaki.github.io'
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Zone-ID',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Handle incoming requests
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 */
async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  try {
    // Only allow GET and POST
    if (request.method !== 'GET' && request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Get credentials from headers
    const authHeader = request.headers.get('Authorization');
    const zoneId = request.headers.get('X-Zone-ID');

    if (!authHeader || !zoneId) {
      return jsonResponse({ 
        error: 'Missing required headers: Authorization and X-Zone-ID' 
      }, 400);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const since = url.searchParams.get('since') || getDateDaysAgo(28);
    const until = url.searchParams.get('until') || getDateDaysAgo(0);

    // Construct Cloudflare API URL
    const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}&continuous=true`;

    console.log(`Fetching analytics for zone ${zoneId} from ${since} to ${until}`);

    // Forward request to Cloudflare API
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Get response data
    const data = await apiResponse.json();

    // Return response with CORS headers
    return new Response(JSON.stringify(data), {
      status: apiResponse.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Worker error:', error);
    return jsonResponse({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
}

/**
 * Helper: Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Helper: Get date X days ago in YYYY-MM-DD format
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * ALTERNATIVE VERSION: Using GraphQL API
 * Uncomment this section if you prefer to use GraphQL instead
 */
/*
async function handleGraphQLRequest(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 400);
  }

  try {
    const body = await request.json();
    
    const graphqlResponse = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await graphqlResponse.json();

    return new Response(JSON.stringify(data), {
      status: graphqlResponse.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
*/

/**
 * ADVANCED: Rate limiting (optional)
 * Add this to prevent abuse
 */
/*
const RATE_LIMIT = 60; // requests per minute
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip).filter(time => time > windowStart);
  
  if (requests.length >= RATE_LIMIT) {
    return false;
  }
  
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return true;
}
*/
