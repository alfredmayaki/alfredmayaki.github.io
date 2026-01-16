/**
 * Environment Variable Loader for Static HTML
 * 
 * Usage: Add this script BEFORE your main HTML loads
 * <script src="env-loader.js"></script>
 * 
 * This script:
 * 1. Reads .env.local file (development only)
 * 2. Parses VITE_* variables
 * 3. Injects them into window.__ENV__ for the app to use
 */

(async function loadEnvironmentVariables() {
  try {
    // Only load in development (localhost)
    const isDevelopment = ['localhost', '127.0.0.1', 'local'].includes(
      window.location.hostname
    );

    if (!isDevelopment) {
      console.log('ℹ️ Production environment detected - skipping .env.local loader');
      return;
    }

    // Try to load .env.local
    const response = await fetch('.env.local');
    
    if (!response.ok) {
      console.warn('⚠️ .env.local file not found. Create it with your Firebase credentials.');
      console.warn('📋 Copy .env.example to .env.local and fill in your values.');
      return;
    }

    const envContent = await response.text();
    const envConfig = {};

    // Parse .env file format: KEY=VALUE
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (!line.trim() || line.trim().startsWith('#')) return;

      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();

      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');

      // Extract VITE_* variables
      if (key.trim().startsWith('VITE_')) {
        const cleanKey = key.trim().replace('VITE_', '');
        envConfig[cleanKey] = cleanValue;
      }
    });

    // Inject into window
    if (Object.keys(envConfig).length > 0) {
      window.__ENV__ = envConfig;
      console.log('✅ Environment variables loaded from .env.local');
      console.log('📦 Config keys:', Object.keys(envConfig).join(', '));

      // Also save to localStorage as backup
      localStorage.setItem('__app_config__', JSON.stringify(envConfig));
    } else {
      console.warn('⚠️ No VITE_* variables found in .env.local');
    }

  } catch (error) {
    console.warn('⚠️ Failed to load environment variables:', error.message);
    console.warn('💡 For production, ensure env vars are set via your hosting platform');
  }
})();
