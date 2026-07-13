import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Extract Ghostscript path lookup logic
function getGhostscriptPath(): string {
  if (process.platform !== "win32") {
    return "gs"; // On Linux/Mac, rely on PATH
  }

  const commonPaths = [
    "C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe",
    "C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe",
    "C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe",
    "C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe",
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  // Fallback dynamic lookup
  try {
    const gsDir = "C:\\Program Files\\gs";
    if (fs.existsSync(gsDir)) {
      const versions = fs.readdirSync(gsDir);
      for (const version of versions) {
        const p = path.join(gsDir, version, "bin", "gswin64c.exe");
        if (fs.existsSync(p)) return p;
      }
    }
  } catch (e) {
    // ignore
  }

  return "gswin64c.exe";
}

const gsExec = getGhostscriptPath();

function runGs(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("Running:", gsExec, args.join(" "));
    const proc = spawn(gsExec, args, { stdio: "pipe" });
    
    let stderr = "";
    proc.stderr.on("data", (d) => stderr += d.toString());
    
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Ghostscript exited with ${code}: ${stderr}`));
    });
    proc.on("error", reject);
  });
}

async function run() {
  const inputPdf = "storage/processed/test_input.pdf";
  const encryptedPdf = "storage/processed/test_encrypted.pdf";
  const decryptedPdf = "storage/processed/test_decrypted.pdf";

  // Create a dummy pdf using pdf-lib if it doesn't exist?
  // Let's just find any pdf in storage
  let testFile = "";
  const files = fs.readdirSync("storage/processed");
  for (const f of files) {
    if (f.endsWith(".pdf")) {
      testFile = path.join("storage/processed", f);
      break;
    }
  }

  if (!testFile) {
    console.error("No test PDF found in storage/processed!");
    return;
  }

  console.log("Using test file:", testFile);

  try {
    console.log("--- TEST 1: Encrypting PDF ---");
    await runGs([
      "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite",
      `-sOutputFile=${encryptedPdf}`,
      "-sOwnerPassword=admin",
      "-sUserPassword=secret",
      "-dEncryptionR=3",
      "-dKeyLength=128",
      testFile
    ]);
    console.log("Encryption SUCCESS.");

    const encryptedSize = fs.statSync(encryptedPdf).size;
    console.log("Encrypted PDF Size:", encryptedSize);

    console.log("--- TEST 2: Decrypting PDF ---");
    await runGs([
      "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite",
      `-sOutputFile=${decryptedPdf}`,
      "-sPDFPassword=secret",
      encryptedPdf
    ]);
    console.log("Decryption SUCCESS.");

    const decryptedSize = fs.statSync(decryptedPdf).size;
    console.log("Decrypted PDF Size:", decryptedSize);

  } catch (err) {
    console.error("Ghostscript test failed:", err);
  }
}

run();
