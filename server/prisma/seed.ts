import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'
import { 
  SYSTEM_ROLES,
  generatePassword 
} from '../lib/constants'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seeding...')

  // Store generated passwords for logging
  const generatedPasswords: { [key: string]: string } = {};

  // 1. Create demo school
  console.log('Creating demo school...')
  await prisma.school.upsert({
    where: { code: 'EVOKE001' },
    update: {
      name: 'Evoke Academy of AI',
      address: '123 Education Street',
      phone: '+1-555-0123',
      email: 'admin@evoke.ac',
      website: 'https://evoke.ac',
    },
    create: {
      name: 'Evoke Academy of AI',
      code: 'EVOKE001',
      address: '123 Education Street',
      phone: '+1-555-0123',
      email: 'admin@evoke.ac',
      website: 'https://evoke.ac',
    },
  });
  console.log('Demo school created/updated.');

  // 2. Create SUPER_ADMIN user
  console.log('Creating SUPER_ADMIN user...')
  const superAdminPlainPassword = generatePassword();
  const superAdminPassword = await hashPassword(superAdminPlainPassword);
  generatedPasswords['superadmin@system.local'] = superAdminPlainPassword;
  
  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { 
      username: 'superadmin',
      systemRole: SYSTEM_ROLES.SUPER_ADMIN 
    }
  });

  if (existingSuperAdmin) {
    // Update existing super admin
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        password: superAdminPassword,
        email: 'superadmin@system.local',
      },
    });
    console.log('SUPER_ADMIN user updated.');
  } else {
    // Create new super admin
    await prisma.user.create({
      data: {
        email: 'superadmin@system.local',
        username: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin',
        password: superAdminPassword,
        systemRole: SYSTEM_ROLES.SUPER_ADMIN,
      },
    });
    console.log('SUPER_ADMIN user created.');
  }

  console.log('Seeding completed successfully!')
  console.log('\n' + '='.repeat(60))
  console.log('🎉 DEMO USERS CREATED WITH GENERATED PASSWORDS')
  console.log('='.repeat(60))
  console.log('📧 Email / 👤 Username → 🔑 Password')
  console.log('-'.repeat(60))
  console.log(`🔴 SUPER_ADMIN: superadmin@system.local / superadmin`)
  console.log(`   Password: ${generatedPasswords['superadmin@system.local']}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 