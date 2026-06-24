import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export type CompressionLevel = 'Basic' | 'Strong' | 'Extreme';

function getGhostscriptPath(): string {
  const isWin = process.platform === 'win32';
  if (!isWin) return 'gs'; // Unix uses 'gs' typically in PATH

  console.log('Detecting Ghostscript path on Windows...');
  console.log(`process.env.PATH: ${process.env.PATH}`);

  try {
    // 1. Try to find via 'where' command (checks PATH)
    const whereResult = execSync('where gswin64c', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const paths = whereResult.split('\n').map(p => p.trim()).filter(Boolean);
    if (paths.length > 0) {
      console.log(`Resolved via 'where': ${paths[0]}`);
      return paths[0];
    }
  } catch (e) {
    // 'where' failed, which means it's not in PATH
  }

  // 2. Search common installation directories
  const programFilesPaths = [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)']
  ];

  for (const pf of programFilesPaths) {
    if (!pf) continue;
    const gsBase = path.join(pf, 'gs');
    if (fs.existsSync(gsBase)) {
      const versions = fs.readdirSync(gsBase);
      // Sort to get latest version if multiple exist
      versions.sort().reverse();
      for (const version of versions) {
        const exePath = path.join(gsBase, version, 'bin', 'gswin64c.exe');
        if (fs.existsSync(exePath)) {
          console.log(`Resolved via default installation path: ${exePath}`);
          return exePath;
        }
      }
    }
  }

  // 3. Fallback to just the executable name and let spawn try its best
  console.log('Could not explicitly detect Ghostscript path. Falling back to "gswin64c"');
  return 'gswin64c';
}

export function compressPdf(
  inputPath: string, 
  outputPath: string, 
  level: CompressionLevel,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let dPDFSETTINGS = '/printer';
    if (level === 'Strong') dPDFSETTINGS = '/ebook';
    if (level === 'Extreme') dPDFSETTINGS = '/screen';

    const gsCommand = getGhostscriptPath();

    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${dPDFSETTINGS}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    console.log(`Starting ghostscript: "${gsCommand}" ${args.join(' ')}`);

    const gsProcess = spawn(gsCommand, args, { 
      // If we are using the raw command 'gswin64c', shell might help, but since we resolved path, shell: false is fine.
      // We will set shell: false and rely on the full path.
    });

    if (onProgress) {
      onProgress(10);
    }

    gsProcess.on('error', (err) => {
      reject(new Error(`Failed to start ghostscript: ${err.message}. Path attempted: ${gsCommand}`));
    });

    gsProcess.on('close', (code) => {
      if (code === 0) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`Ghostscript exited with code ${code}`));
      }
    });
  });
}
