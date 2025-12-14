import { copyFileSync } from 'fs';
import { resolve } from 'path';

const [,, source, target] = process.argv;

try {
  copyFileSync(
    resolve(process.cwd(), source),
    resolve(process.cwd(), target)
  );
  console.log(`Successfully copied ${source} to ${target}`);
} catch (error) {
  console.error(`Error copying file: ${error.message}`);
  process.exit(1);
} 