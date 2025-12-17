// Quick test script to verify basic setup
const config = require('./src/config/config');
const logger = require('./src/utils/logger');

console.log('🔍 Whatstutor AI - Configuration Test\n');

// Test 1: Configuration loading
console.log('✓ Configuration module loaded');
console.log(`  Port: ${config.port}`);
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Log Level: ${config.app.logLevel}`);
console.log();

// Test 2: Logger
logger.info('Testing logger - INFO level');
logger.warn('Testing logger - WARN level');
logger.error('Testing logger - ERROR level');
console.log('✓ Logger working\n');

// Test 3: Configuration validation
console.log('📋 Configuration Validation:');
const isValid = config.validate();

if (!isValid) {
    console.log('\n⚠️  Some environment variables are missing.');
    console.log('   This is expected if you haven\'t configured .env yet.');
    console.log('   Follow these steps:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Fill in your Twilio credentials');
    console.log('   3. Fill in your Google Cloud credentials');
    console.log('   4. Re-run this test');
} else {
    console.log('✅ All configuration valid!');
}

console.log('\n🎉 Basic setup verification complete!');
console.log('\nNext steps:');
console.log('  1. Configure your .env file (see .env.example)');
console.log('  2. Set up Google Cloud credentials');
console.log('  3. Configure Twilio webhook');
console.log('  4. Run: npm run dev');
console.log('\nDocumentation:');
console.log('  - README.md');
console.log('  - docs/SETUP_GUIDE.md');
console.log('  - docs/ARCHITECTURE.md');
