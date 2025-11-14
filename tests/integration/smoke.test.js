const path = require('path');
const { spawn } = require('child_process');

function runElectronOnce() {
  return new Promise((resolve, reject) => {
    const projectRoot = path.resolve(__dirname, '..', '..');
    const electronCli = path.join(projectRoot, 'node_modules', 'electron', 'cli.js');

    const child = spawn(process.execPath, [electronCli, '.'], {
      cwd: projectRoot,
      env: { ...process.env, INTEGRATION_TEST: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let readySeen = false;
    let stderrData = '';

    child.stdout.on('data', (buf) => {
      const s = buf.toString();
      if (s.includes('READY')) {
        readySeen = true;
      }
    });
    child.stderr.on('data', (buf) => {
      stderrData += buf.toString();
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', (code) => {
      if (code === 0 && readySeen) {
        resolve(true);
      } else {
        reject(new Error(`Electron exited with code ${code}. READY seen: ${readySeen}. Stderr: ${stderrData}`));
      }
    });

    // Safety: kill if it hangs beyond 10s
    setTimeout(() => {
      try { child.kill('SIGTERM'); } catch (_) {}
    }, 10000);
  });
}

describe('Electron overlay smoke', () => {
  it('launches, signals READY, and exits', async () => {
    await expect(runElectronOnce()).resolves.toBe(true);
  });
});



