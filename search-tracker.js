/**
 * Cloudflare Worker: Search Tracker API
 * Handles search tracking, storage, and tag cloud generation
 * 
 * Required KV Namespace: SEARCH_DATA
 * 
 * Endpoints:
 * - POST /api/search/track - Track a search query
 * - GET /api/search/cloud?userId=xxx - Get user's tag cloud
 * - GET /api/search/global - Get global aggregated stats
 * - DELETE /api/search/clear?userId=xxx - Clear user's data
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://alfredmayaki.me', // ← Restrict to your domain!
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key', // ← Add API Key header
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ========================================
    // 🔐 AUTHENTICATION CHECK
    // ========================================
    // For write operations, require API key
    if (['POST', 'DELETE'].includes(request.method)) {
      const apiKey = request.headers.get('X-API-Key');

      if (!apiKey || apiKey !== env.API_SECRET) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized - Invalid or missing API key' 
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    try {
      // Route handling (existing code)
      if (path === '/api/search/track' && request.method === 'POST') {
        return handleTrackSearch(request, env, corsHeaders);
      }
      
      if (path === '/api/search/cloud' && request.method === 'GET') {
        return handleGetCloud(request, env, corsHeaders);
      }
      
      if (path === '/api/search/global' && request.method === 'GET') {
        return handleGetGlobal(request, env, corsHeaders);
      }
      
      if (path === '/api/search/clear' && request.method === 'DELETE') {
        return handleClearData(request, env, corsHeaders);
      }

      // 404 for unknown routes
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

/**
 * Track a search query
 * POST /api/search/track
 * Body: { userId: string, query: string, keywords: string[] }
 */
async function handleTrackSearch(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const { userId, query, keywords } = data;

    if (!userId || !query) {
      return jsonResponse({ error: 'Missing userId or query' }, 400, corsHeaders);
    }

    const timestamp = Date.now();
    const searchId = `search:${userId}:${timestamp}`;

    // Store individual search
    await env.SEARCH_DATA.put(searchId, JSON.stringify({
      query,
      keywords,
      timestamp
    }), {
      expirationTtl: 60 * 60 * 24 * 90, // 90 days
      metadata: { userId, timestamp }
    });

    // Update user keyword counts
    for (const keyword of keywords) {
      const key = `user:${userId}:keyword:${keyword}`;
      const currentCount = parseInt(await env.SEARCH_DATA.get(key) || '0');
      await env.SEARCH_DATA.put(key, (currentCount + 1).toString(), {
        expirationTtl: 60 * 60 * 24 * 90
      });
    }

    // Update global keyword counts
    for (const keyword of keywords) {
      const globalKey = `global:keyword:${keyword}`;
      const currentGlobalCount = parseInt(await env.SEARCH_DATA.get(globalKey) || '0');
      await env.SEARCH_DATA.put(globalKey, (currentGlobalCount + 1).toString());
    }

    // Update global search count
    const globalCountKey = 'global:totalSearches';
    const totalSearches = parseInt(await env.SEARCH_DATA.get(globalCountKey) || '0');
    await env.SEARCH_DATA.put(globalCountKey, (totalSearches + 1).toString());

    return jsonResponse({ 
      success: true,
      searchId,
      timestamp 
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Track search error:', error);
    return jsonResponse({ error: 'Failed to track search' }, 500, corsHeaders);
  }
}

/**
 * Get user's tag cloud data
 * GET /api/search/cloud?userId=xxx&limit=50
 */
async function handleGetCloud(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!userId) {
      return jsonResponse({ error: 'Missing userId' }, 400, corsHeaders);
    }

    // Get user's keyword counts
    const keywordPrefix = `user:${userId}:keyword:`;
    const keywordList = await env.SEARCH_DATA.list({ prefix: keywordPrefix });
    
    const keywords = {};
    for (const key of keywordList.keys) {
      const keyword = key.name.replace(keywordPrefix, '');
      const count = parseInt(await env.SEARCH_DATA.get(key.name));
      keywords[keyword] = count;
    }

    // Get user's recent searches
    const searchPrefix = `search:${userId}:`;
    const searchList = await env.SEARCH_DATA.list({ 
      prefix: searchPrefix,
      limit: 10 
    });
    
    const recentSearches = [];
    for (const key of searchList.keys) {
      const searchData = await env.SEARCH_DATA.get(key.name);
      if (searchData) {
        recentSearches.push(JSON.parse(searchData));
      }
    }

    // Sort by timestamp descending
    recentSearches.sort((a, b) => b.timestamp - a.timestamp);

    return jsonResponse({
      keywords,
      recentSearches: recentSearches.slice(0, 10),
      totalSearches: recentSearches.length,
      uniqueWords: Object.keys(keywords).length
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get cloud error:', error);
    return jsonResponse({ error: 'Failed to get cloud data' }, 500, corsHeaders);
  }
}

/**
 * Get global aggregated stats
 * GET /api/search/global?limit=50
 */
async function handleGetGlobal(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Get global keyword counts
    const globalPrefix = 'global:keyword:';
    const keywordList = await env.SEARCH_DATA.list({ prefix: globalPrefix });
    
    const keywords = {};
    for (const key of keywordList.keys) {
      const keyword = key.name.replace(globalPrefix, '');
      const count = parseInt(await env.SEARCH_DATA.get(key.name));
      keywords[keyword] = count;
    }

    // Sort by count and limit
    const sortedKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});

    // Get total search count
    const totalSearches = parseInt(await env.SEARCH_DATA.get('global:totalSearches') || '0');

    return jsonResponse({
      keywords: sortedKeywords,
      totalSearches,
      uniqueWords: Object.keys(sortedKeywords).length
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Get global error:', error);
    return jsonResponse({ error: 'Failed to get global data' }, 500, corsHeaders);
  }
}

/**
 * Clear user's search data
 * DELETE /api/search/clear?userId=xxx
 */
async function handleClearData(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return jsonResponse({ error: 'Missing userId' }, 400, corsHeaders);
    }

    // Delete user's searches
    const searchPrefix = `search:${userId}:`;
    const searchList = await env.SEARCH_DATA.list({ prefix: searchPrefix });
    
    for (const key of searchList.keys) {
      await env.SEARCH_DATA.delete(key.name);
    }

    // Delete user's keyword counts
    const keywordPrefix = `user:${userId}:keyword:`;
    const keywordList = await env.SEARCH_DATA.list({ prefix: keywordPrefix });
    
    for (const key of keywordList.keys) {
      await env.SEARCH_DATA.delete(key.name);
    }

    return jsonResponse({ 
      success: true,
      message: 'User data cleared' 
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Clear data error:', error);
    return jsonResponse({ error: 'Failed to clear data' }, 500, corsHeaders);
  }
}

/**
 * Helper: Create JSON response
 */
function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
