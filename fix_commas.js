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
  
  // Fix the missing comma issue
  content = content.replace(/storagePath: ([^\n,]+)\n\s*expiresAt/g, "storagePath: $1,\n          expiresAt");
  
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
