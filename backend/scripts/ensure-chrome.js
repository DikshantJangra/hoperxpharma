#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const puppeteer = require('puppeteer');

/**
 * Ensure Chrome is available before starting the server
 * - First checks if system Chrome exists (from Docker)
 * - Falls back to installing via Puppeteer if not found
 */
async function ensureChrome() {
    console.log('🔍 Checking for Chrome installation...');

    // List of system Chrome locations to check
    const systemChromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
    ];

    // Check if system Chrome exists (from Docker)
    for (const chromePath of systemChromePaths) {
        if (fs.existsSync(chromePath)) {
            console.log('✅ System Chrome found at:', chromePath);
            console.log('✅ Chrome check complete. Starting server...\n');
            return;
        }
    }

    console.log('⚠️  System Chrome not found. Checking Puppeteer installation...');

    // Try to use Puppeteer's installed Chrome
    try {
        const puppeteerPath = puppeteer.executablePath();
        if (fs.existsSync(puppeteerPath)) {
            console.log('✅ Puppeteer Chrome found at:', puppeteerPath);
            console.log('✅ Chrome check complete. Starting server...\n');
            return;
        }
    } catch (error) {
        console.log('⚠️  Puppeteer Chrome not found');
    }

    // No Chrome found - install it now
    console.log('📥 No Chrome installation found. Installing Chrome at runtime...');
    console.log('⏳ This may take 30-60 seconds on first startup...\n');

    try {
        execSync('npx puppeteer browsers install chrome', {
            stdio: 'inherit',
            env: { ...process.env }
        });

        console.log('\n✅ Chrome installed successfully!');
        console.log('✅ Starting server...\n');
    } catch (error) {
        console.error('\n❌ Failed to install Chrome at runtime:', error.message);
        console.error('\n⚠️  PDF generation will fail until Chrome is installed.');
        console.error('Consider deploying with Docker to have Chrome pre-installed.\n');
        // Don't exit - let the app start anyway, PDFs just won't work
    }
}

// Run the check
ensureChrome()
    .then(() => {
        // Start the actual server
        require('../src/server.js');
    })
    .catch((error) => {
        console.error('❌ Chrome check failed:', error);
        // Start server anyway
        require('../src/server.js');
    });
