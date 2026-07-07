const { spawnSync } = require('child_process');
const path = require('path');

const seedFiles = [
  'seedDatabase.js',
  'seedUsers.js',
  'seedItems.js',
  'seedOrders.js'
];

for (const file of seedFiles) {
  console.log(`\nRunning ${file}...`);
  const result = spawnSync('node', [path.join(__dirname, file)], {
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(`Failed to run ${file}:`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${file} exited with code ${result.status}.`);
    process.exit(result.status);
  }
}

console.log('\nAll seeders finished successfully.');
