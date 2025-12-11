#!/usr/bin/env node

/**
 * Runtime Chrome Installation for Render
 * This script ensures Chrome is available before starting the server
 */

const { execSync } = require('child_process');

async function ensureChrome() {
    console.log('🔍 Checking for Chrome installation...');

    try {
        // Check for system Chrome first
        execSync('google-chrome --version', { stdio: 'ignore' });
        console.log('✅ System Chrome found.');
    } catch (err) {
        console.log('⚠️  System Chrome not found. Installing Puppeteer Chrome...');

        try {
            // Force Puppeteer to download Chromium
            execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
            console.log('✅ Chrome installed successfully!');
        } catch (installError) {
            console.error('❌ Failed to install Chrome:', installError.message);
            console.error('⚠️  PDF generation may not work.');
        }
    }

    console.log('✅ Starting server...');

    // Start your Express app using execSync to avoid module loading issues
    execSync('node src/server.js', { stdio: 'inherit' });
}

ensureChrome();
