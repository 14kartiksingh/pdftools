const fs = require('fs');

const files = [
  "app/api/tools/watermark/route.ts",
  "app/api/tools/split/route.ts",
  "app/api/tools/merge/route.ts",
  "app/api/tools/reorder/route.ts",
  "app/api/tools/rotate/route.ts",
  "app/api/tools/page-numbers/route.ts",
  "app/api/tools/extract/route.ts",
  "app/api/tools/delete-pages/route.ts",
  "app/api/tools/image-to-pdf/route.ts",
  "worker.ts"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find all prisma.file.create
  // We'll replace `storagePath: outputPath` or `storagePath: newStoragePath` or `storagePath,`
  // with `storagePath,\n          expiresAt: new Date(Date.now() + 30 * 60 * 1000),`
  
  content = content.replace(/storagePath:([^\n]+)\n/g, "storagePath:$1\n          expiresAt: new Date(Date.now() + 30 * 60 * 1000),\n");
  content = content.replace(/storagePath,(\s*)\n/g, "storagePath,\n          expiresAt: new Date(Date.now() + 30 * 60 * 1000),$1\n");
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
