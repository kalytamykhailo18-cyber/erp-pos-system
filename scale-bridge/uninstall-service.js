/**
 * Windows Service Uninstaller
 * Run this script to uninstall Scale Bridge Windows service
 */

const { Service } = require('node-windows');
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Scale Bridge',
  script: path.join(__dirname, 'index.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', () => {
  console.log('✅ Scale Bridge service uninstalled successfully!');
  console.log('The service has been removed from Windows services.');
});

svc.on('alreadyuninstalled', () => {
  console.log('⚠️  Service is not installed.');
});

svc.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

// Uninstall the service
console.log('Uninstalling Scale Bridge service...');
console.log('This requires administrator privileges.\n');
svc.uninstall();
