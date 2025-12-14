import { rm, cp, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

const [,, env] = process.argv;

async function saveMigrations() {
  const migrationsPath = resolve(process.cwd(), 'prisma/migrations');
  const envMigrationsPath = resolve(process.cwd(), `prisma/migrations-${env}`);
  const tempMigrationsPath = resolve(process.cwd(), `prisma/migrations-temp`);

  try {
    // Backup existing environment-specific migrations if they exist
    if (existsSync(envMigrationsPath)) {
      // Create temp directory if it doesn't exist
      if (!existsSync(tempMigrationsPath)) {
        await mkdir(tempMigrationsPath, { recursive: true });
      }
      await cp(envMigrationsPath, tempMigrationsPath, { recursive: true });
      await rm(envMigrationsPath, { recursive: true, force: true });
    }

    // Copy current migrations to environment-specific directory
    if (existsSync(migrationsPath)) {
      // Create environment migrations directory if it doesn't exist
      if (!existsSync(envMigrationsPath)) {
        await mkdir(envMigrationsPath, { recursive: true });
      }
      await cp(migrationsPath, envMigrationsPath, { recursive: true });
      console.log(`Successfully saved migrations for ${env} environment`);
    } else {
      console.log(`No migrations found to save for ${env} environment`);
    }
  } catch (error) {
    // Restore from backup if something went wrong
    if (existsSync(tempMigrationsPath)) {
      if (existsSync(envMigrationsPath)) {
        await rm(envMigrationsPath, { recursive: true, force: true });
      }
      await cp(tempMigrationsPath, envMigrationsPath, { recursive: true });
    }
    console.error(`Error saving migrations: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up temp directory
    if (existsSync(tempMigrationsPath)) {
      await rm(tempMigrationsPath, { recursive: true, force: true });
    }
  }
}

saveMigrations(); 