import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { rm, cp } from 'fs/promises';
import { execSync } from 'child_process';

const [,, env] = process.argv;

async function switchDb() {
  const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
  const envSchemaPath = resolve(process.cwd(), `prisma/schema.${env}.prisma`);
  const migrationsPath = resolve(process.cwd(), 'prisma/migrations');
  const envMigrationsPath = resolve(process.cwd(), `prisma/migrations-${env}`);

  try {
    // Copy the environment-specific schema
    copyFileSync(envSchemaPath, schemaPath);
    console.log(`Switched to ${env} schema`);

    // Handle migrations
    if (existsSync(migrationsPath)) {
      await rm(migrationsPath, { recursive: true, force: true });
    }

    if (existsSync(envMigrationsPath)) {
      await cp(envMigrationsPath, migrationsPath, { recursive: true });
      console.log(`Switched to ${env} migrations`);
    }

    // Generate Prisma client
    execSync('prisma generate', { stdio: 'inherit' });
    console.log('Generated Prisma client');
  } catch (error) {
    console.error(`Error switching database environment: ${error.message}`);
    process.exit(1);
  }
}

switchDb(); 