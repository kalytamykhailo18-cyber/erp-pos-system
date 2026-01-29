/**
 * Windows Service Installer
 * Run this script to install Scale Bridge as a Windows service
 */

const { Service } = require('node-windows');
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Scale Bridge',
  description: 'Local bridge service for Kretz Aura scale synchronization',
  script: path.join(__dirname, 'index.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [{
    name: 'NODE_ENV',
    value: 'production'
  }]
});

// Listen for the "install" event
svc.on('install', () => {
  console.log('✅ Scale Bridge service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', () => {
  console.log('✅ Service started!');
  console.log('\nService Information:');
  console.log('  Name:', svc.name);
  console.log('  Description:', svc.description);
  console.log('  Script:', svc.script);
  console.log('\nThe service will now start automatically on system boot.');
  console.log('\nTo view logs, check the "logs" folder in:', __dirname);
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️  Service is already installed.');
  console.log('To reinstall, first run: node uninstall-service.js');
});

svc.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

// Install the service
console.log('Installing Scale Bridge service...');
console.log('This requires administrator privileges.\n');
svc.install();
