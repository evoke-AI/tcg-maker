import { rm, cp, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

const [,, env] = process.argv;

async function prepareMigrations() {
  const migrationsPath = resolve(process.cwd(), 'prisma/migrations');
  const envMigrationsPath = resolve(process.cwd(), `prisma/migrations-${env}`);
  const tempMigrationsPath = resolve(process.cwd(), `prisma/migrations-temp`);

  try {
    // Backup existing migrations if they exist
    if (existsSync(migrationsPath)) {
      // Create temp directory if it doesn't exist
      if (!existsSync(tempMigrationsPath)) {
        await mkdir(tempMigrationsPath, { recursive: true });
      }
      await cp(migrationsPath, tempMigrationsPath, { recursive: true });
      await rm(migrationsPath, { recursive: true, force: true });
    }

    // Copy environment-specific migrations if they exist
    if (existsSync(envMigrationsPath)) {
      await cp(envMigrationsPath, migrationsPath, { recursive: true });
      console.log(`Successfully prepared migrations for ${env} environment`);
    } else {
      console.log(`No existing migrations found for ${env} environment`);
      // Create migrations directory if it doesn't exist
      if (!existsSync(migrationsPath)) {
        await mkdir(migrationsPath, { recursive: true });
      }
    }
  } catch (error) {
    // Restore from backup if something went wrong
    if (existsSync(tempMigrationsPath)) {
      if (existsSync(migrationsPath)) {
        await rm(migrationsPath, { recursive: true, force: true });
      }
      await cp(tempMigrationsPath, migrationsPath, { recursive: true });
    }
    console.error(`Error preparing migrations: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up temp directory
    if (existsSync(tempMigrationsPath)) {
      await rm(tempMigrationsPath, { recursive: true, force: true });
    }
  }
}

prepareMigrations(); 