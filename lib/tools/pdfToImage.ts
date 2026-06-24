import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import AdmZip from "adm-zip"

function getGhostscriptPath() {
  if (process.platform !== 'win32') {
    return 'gs';
  }

  const commonPaths = [
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.07.0\\bin\\gswin64c.exe'
  ];

  for (const gsPath of commonPaths) {
    if (fs.existsSync(gsPath)) return gsPath;
  }

  try {
    const { execSync } = require('child_process');
    const gsPath = execSync('where gswin64c').toString().split('\n')[0].trim();
    if (gsPath) return gsPath;
  } catch (err) {}

  const gsDir = 'C:\\Program Files\\gs';
  if (fs.existsSync(gsDir)) {
    const versions = fs.readdirSync(gsDir);
    for (const version of versions) {
      const gsPath = path.join(gsDir, version, 'bin', 'gswin64c.exe');
      if (fs.existsSync(gsPath)) return gsPath;
    }
  }

  return 'gswin64c';
}

export async function pdfToImage(
  inputPath: string,
  outputZipPath: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(path.dirname(outputZipPath), `pdf2img_${Date.now()}`);
    
    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    } catch (err) {
      return reject(new Error(`Failed to create temp directory: ${err}`));
    }

    const gsExec = getGhostscriptPath();
    const outputPattern = path.join(tempDir, "page-%03d.jpg");

    // We can't easily parse progress from Ghostscript for multiple pages in real-time
    // without complex output parsing. We'll set it to 50% once GS finishes, and 100% when zipped.
    if (onProgress) onProgress(10);

    const args = [
      "-dNOPAUSE",
      "-dBATCH",
      "-sDEVICE=jpeg",
      "-r150", // 150 DPI is a good balance for quality/size
      "-dJPEGQ=85", // High quality JPEG
      `-sOutputFile=${outputPattern}`,
      inputPath
    ];

    const child = spawn(gsExec, args, {}); // Using full resolved path without shell:true

    child.on('error', (err: any) => {
      // Try to clean up
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
      
      if (err.code === 'ENOENT') {
        reject(new Error(`Ghostscript executable not found. Ensure Ghostscript is installed and in your PATH.`));
      } else {
        reject(new Error(`Failed to start Ghostscript: ${err.message}`));
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
        return reject(new Error(`Ghostscript exited with code ${code}`));
      }

      if (onProgress) onProgress(70);

      try {
        const zip = new AdmZip();
        const files = fs.readdirSync(tempDir);
        
        if (files.length === 0) {
          throw new Error("No images were generated.");
        }

        for (const file of files) {
          zip.addLocalFile(path.join(tempDir, file));
        }

        zip.writeZip(outputZipPath);
        
        if (onProgress) onProgress(100);
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        // Cleanup temp images directory
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
      }
    });
  });
}
