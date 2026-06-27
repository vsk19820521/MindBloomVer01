/**
 * _supabase.js — Shared Supabase Client
 * Used by all Vercel serverless API functions.
 * This file runs server-side only — the service key never reaches the browser.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Fallback: manually parse .env.local if Vercel CLI fails to inject it
if (!process.env.SUPABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      });
    }
  } catch(e) {
    console.warn("Failed to manually parse .env.local", e);
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY. ' +
    'Set them in your Vercel dashboard or .env.local file.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,  // server-side: no session persistence needed
    autoRefreshToken: false
  }
});

module.exports = { supabase };
