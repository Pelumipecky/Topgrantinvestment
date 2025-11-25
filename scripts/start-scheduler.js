const { spawn } = require('child_process');
const path = require('path');

// Configuration
const SCRIPT_PATH = path.join(__dirname, 'update-daily-roi.js');
const INTERVAL_HOURS = 24;
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

console.log(`Starting ROI Scheduler...`);
console.log(`Script: ${SCRIPT_PATH}`);
console.log(`Interval: Every ${INTERVAL_HOURS} hours`);

function runScript() {
  console.log(`[${new Date().toISOString()}] Running update script...`);
  
  const child = spawn('node', [SCRIPT_PATH], {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    console.log(`[${new Date().toISOString()}] Script finished with code ${code}`);
    console.log(`Next run in ${INTERVAL_HOURS} hours.`);
  });
}

// Run immediately on start
runScript();

// Schedule subsequent runs
setInterval(runScript, INTERVAL_MS);
