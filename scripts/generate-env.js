'use strict';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const outputPath = path.join(rootDir, 'public', 'env.js');

const envResult = dotenv.config({ path: envPath, quiet: true });
if (envResult.error && !fs.existsSync(envPath)) {
  console.warn('[env] No .env file found, writing empty config.');
} else if (envResult.error) {
  console.warn(`[env] Could not read .env: ${envResult.error.message}`);
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
};

const envPayload = {
  firebase: firebaseConfig,
};

const output = `window.__env = ${JSON.stringify(envPayload, null, 2)};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`[env] Wrote ${path.relative(rootDir, outputPath)}`);
