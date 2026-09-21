Deploying the /api/chatgpt backend

This repository includes a simple Express server example at `server-example.js` that exposes `/api/chatgpt` and serves the static site.

Local (development)
1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open `http://localhost:3000` and use the "Ask OpenAI" button.

Heroku (recommended simple deploy)
1. Ensure you have the Heroku CLI installed and are logged in.
2. Create a Heroku app:
   ```
   heroku create your-app-name
   ```
3. Set the OpenAI key:
   ```
   heroku config:set OPENAI_API_KEY=sk-...your_key_here
   ```
4. Push to Heroku (assuming `origin` is your Git remote):
   ```
   git push heroku main
   ```
5. The app will be available at `https://your-app-name.herokuapp.com`.

Render / Other services
- Render: Create a new Web Service, set build command `npm install` and start command `npm start`. Add `OPENAI_API_KEY` in environment variables.
- Vercel: Use a Serverless Function for `/api/chatgpt` and set the environment variable in the dashboard.

Notes
- Do not commit `.env` or your OpenAI key.
- If front-end and server are on different origins, ensure CORS is allowed or update the client to call the correct host.
- Rate limiting is enabled in the example to help prevent abuse.
