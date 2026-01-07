const allowedOrigin = "https://alfredmayaki.github.io";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    if (url.pathname === "/auth/login") {
      return redirectToGitHubAuth(url, env);
    }

    if (url.pathname === "/auth/callback") {
      return handleGitHubCallback(url, env);
    }

    if (url.pathname === "/auth/logout") {
      return withCors(
        request,
        new Response("OK", {
          status: 200,
          headers: {
            "Set-Cookie": buildCookie("session", "", { maxAge: 0 }),
            "Content-Type": "text/plain; charset=utf-8",
          },
        }),
      );
    }

    if (url.pathname === "/pdfs") {
      const session = getCookie(request.headers.get("Cookie") || "", "session");
      if (!session || session !== env.SESSION_SECRET) {
        // For XHR/fetch: return 401 so the front-end can navigate to /auth/login interactively.
        return withCors(request, json({ error: "unauthorized", loginUrl: new URL("/auth/login", url).toString() }, 401));
      }

      // TODO: Replace stub with your private repo listing logic.
      return withCors(request, json({ pdfs: [] }));
    }

    return withCors(request, new Response("Not Found", { status: 404 }));
  },
};

function handleOptions(request) {
  const origin = request.headers.get("Origin") || "";
  const headers = new Headers();

  if (origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin");
    return new Response(null, { status: 204, headers });
  }

  return new Response(null, { status: 403 });
}

function withCors(request, response) {
  const origin = request.headers.get("Origin") || "";
  if (origin !== allowedOrigin) return response;

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function redirectToGitHubAuth(url, env) {
  const redirectUri = new URL("/auth/callback", url).toString();

  const gh = new URL("https://github.com/login/oauth/authorize");
  gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  gh.searchParams.set("redirect_uri", redirectUri);
  gh.searchParams.set("scope", "read:user");

  return Response.redirect(gh.toString(), 302);
}

async function handleGitHubCallback(url, env) {
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const token = await exchangeCodeForAccessToken(code, url, env);
  if (!token) {
    return new Response("OAuth failed", { status: 401 });
  }

  const headers = new Headers();
  headers.set("Set-Cookie", buildCookie("session", env.SESSION_SECRET, { maxAge: 60 * 60 * 8 }));
  headers.set("Location", env.POST_LOGIN_REDIRECT_URL || "/pdf-viewer.html");

  // This is a top-level navigation redirect; CORS headers aren't needed here.
  return new Response(null, { status: 302, headers });
}

async function exchangeCodeForAccessToken(code, url, env) {
  const redirectUri = new URL("/auth/callback", url).toString();

  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "pdf-worker",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!resp.ok) return null;

  const data = await resp.json();
  return typeof data.access_token === "string" ? data.access_token : null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function getCookie(cookieHeader, name) {
  const parts = cookieHeader.split(";").map(x => x.trim());
  for (const p of parts) {
    if (!p) continue;
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const k = p.slice(0, eq);
    if (k === name) return decodeURIComponent(p.slice(eq + 1));
  }
  return null;
}

function buildCookie(name, value, { maxAge } = {}) {
  const attrs = [];
  attrs.push(`${name}=${encodeURIComponent(value)}`);
  attrs.push("Path=/");
  attrs.push("HttpOnly");
  attrs.push("Secure");
  // Required for cross-site cookie usage:
  attrs.push("SameSite=None");
  if (typeof maxAge === "number") attrs.push(`Max-Age=${maxAge}`);
  return attrs.join("; ");
}