const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

function analyzeScreenshot(imageBuffer) {
  const width = imageBuffer.readUInt32BE(16);
  const height = imageBuffer.readUInt32BE(20);
  
  return {
    width,
    height,
    hasContent: width > 100 && height > 100
  };
}

describe('Hierarchy Visualization Screenshot Test', () => {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const screenshotsDir = path.join(projectRoot, 'test-screenshots');
  const screenshotPath = path.join(screenshotsDir, 'hierarchy-visualization.png');
  let electronProcess = null;

  beforeAll(async () => {
    await fs.mkdir(screenshotsDir, { recursive: true });
  });

  afterEach(() => {
    if (electronProcess) {
      electronProcess.kill();
      electronProcess = null;
    }
  });

  test('should capture and verify hierarchy visualization screenshot', async () => {
    return new Promise((resolve, reject) => {
      const electronPath = require('electron');
      const mainJsPath = path.join(projectRoot, 'main.js');
      
      electronProcess = spawn(electronPath, [mainJsPath], {
        cwd: projectRoot,
        stdio: 'pipe',
        env: { ...process.env, CAPTURE_SCREENSHOT: '1' }
      });

      let stdout = '';
      let stderr = '';

      electronProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      electronProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      electronProcess.on('close', async (code) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const stats = await fs.stat(screenshotPath);
          expect(stats.size).toBeGreaterThan(1000);
          
          const imageBuffer = await fs.readFile(screenshotPath);
          const analysis = analyzeScreenshot(imageBuffer);
          
          expect(analysis.hasContent).toBe(true);
          expect(analysis.width).toBeGreaterThan(800);
          expect(analysis.height).toBeGreaterThan(600);
          
          console.log(`\n✓ Screenshot captured and verified`);
          console.log(`  Path: ${screenshotPath}`);
          console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
          console.log(`  Dimensions: ${analysis.width}x${analysis.height}`);
          
          if (stdout.includes('Screenshot saved')) {
            console.log(`  ✓ Electron confirmed screenshot save`);
          }
          
          if (code !== 0 && code !== null) {
            console.warn(`  ⚠ Electron exited with code ${code}`);
          }
          
          resolve();
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.error(`\n✗ Screenshot file not found: ${screenshotPath}`);
            console.error(`  stdout: ${stdout}`);
            console.error(`  stderr: ${stderr}`);
            reject(new Error(`Screenshot file not found. Electron output:\n${stdout}\n${stderr}`));
          } else {
            reject(err);
          }
        }
      });

      electronProcess.on('error', (err) => {
        reject(new Error(`Failed to start Electron: ${err.message}`));
      });

      setTimeout(() => {
        if (electronProcess && !electronProcess.killed) {
          electronProcess.kill();
          reject(new Error('Test timeout after 40 seconds'));
        }
      }, 40000);
    });
  }, 45000);
});
