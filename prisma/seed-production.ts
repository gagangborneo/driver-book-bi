import { PrismaClient, UserRole, VehicleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedOptions {
  force?: boolean;
  verbose?: boolean;
}

async function seedProduction(options: SeedOptions = {}) {
  const { force = false, verbose = true } = options;

  const log = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    if (!verbose && type !== 'error') return;

    const icons = {
      info: 'ℹ️ ',
      success: '✅',
      warn: '⚠️ ',
      error: '❌',
    };
    console.log(`${icons[type]} ${message}`);
  };

  try {
    log('🌱 Starting production seeding...', 'info');

    // 1. Seed admin user
    await seedAdminUser(prisma, log, force);

    // 2. Seed default vehicles
    const vehicles = await seedDefaultVehicles(prisma, log, force);

    // 3. Seed test users (employee & driver)
    const users = await seedTestUsers(prisma, log, force, vehicles);

    // 4. Seed test bookings
    await seedBookings(prisma, log, force, users, vehicles);

    // 5. Seed WhatsApp configuration
    await seedWhatsAppConfig(prisma, log, force);

    // 6. Seed WhatsApp templates
    await seedWhatsAppTemplates(prisma, log, force);

    log('✅ Production seeding completed successfully!', 'success');
  } catch (error) {
    log(`❌ Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedAdminUser(
  prisma: PrismaClient,
  log: (message: string, type: string) => void,
  force: boolean
) {
  const adminEmail = 'admin@bi.go.id';

  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminExists && !force) {
    log(`⏭️  Admin user already exists (${adminEmail}), skipping...`, 'warn');
    return;
  }

  if (adminExists && force) {
    log(`🔄 Updating existing admin user...`, 'info');
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: 'Admin',
        phone: '082112345678',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe@123', 10),
        isActive: true,
      },
    });
    log(`✅ Admin user updated`, 'success');
  } else {
    log(`👤 Creating admin user...`, 'info');
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        phone: '082112345678',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe@123', 10),
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    log(`✅ Admin user created`, 'success');
  }
}

async function seedDefaultVehicles(
  prisma: PrismaClient,
  log: (message: string, type: string) => void,
  force: boolean
) {
  const vehicleCount = await prisma.vehicle.count();

  if (vehicleCount > 0 && !force) {
    log(`⏭️  ${vehicleCount} vehicles already exist, skipping...`, 'warn');
    const existingVehicles = await prisma.vehicle.findMany();
    return existingVehicles;
  }

  log(`🚗 Creating default vehicles...`, 'info');

  const defaultVehicles = [
    {
      plateNumber: 'B 1234 ABC',
      brand: 'Toyota',
      model: 'Avanza',
      year: 2023,
      color: 'White',
      status: VehicleStatus.AVAILABLE,
    },
    {
      plateNumber: 'B 5678 DEF',
      brand: 'Honda',
      model: 'CR-V',
      year: 2022,
      color: 'Black',
      status: VehicleStatus.AVAILABLE,
    },
  ];

  const createdVehicles = [];
  for (const vehicle of defaultVehicles) {
    const exists = await prisma.vehicle.findUnique({
      where: { plateNumber: vehicle.plateNumber },
    });

    if (exists && !force) {
      log(`  ⏭️  ${vehicle.plateNumber} already exists`, 'warn');
      createdVehicles.push(exists);
      continue;
    }

    if (exists && force) {
      const updated = await prisma.vehicle.update({
        where: { plateNumber: vehicle.plateNumber },
        data: vehicle,
      });
      log(`  ✅ ${vehicle.plateNumber} updated`, 'success');
      createdVehicles.push(updated);
    } else {
      const created = await prisma.vehicle.create({ data: vehicle });
      log(`  ✅ ${vehicle.plateNumber} created`, 'success');
      createdVehicles.push(created);
    }
  }

  return createdVehicles;
}

async function seedTestUsers(
  prisma: PrismaClient,
  log: (message: string, type: string) => void,
  force: boolean,
  vehicles: any[]
) {
  log(`👥 Creating test users (employees and drivers)...`, 'info');

  const testUsers = [];

  // Create 2 employees
  const employees = [
    {
      email: 'employee.budi@bi.go.id',
      name: 'Budi Santoso',
      phone: '081234567890',
      role: UserRole.EMPLOYEE,
    },
    {
      email: 'employee.siti@bi.go.id',
      name: 'Siti Rahayu',
      phone: '081234567891',
      role: UserRole.EMPLOYEE,
    },
  ];

  for (const emp of employees) {
    const exists = await prisma.user.findUnique({
      where: { email: emp.email },
    });

    if (exists) {
      if (!force) {
        log(`  ⏭️  ${emp.name} already exists`, 'warn');
        testUsers.push(exists);
        continue;
      } else {
        // Update if force flag is set
        const updated = await prisma.user.update({
          where: { email: emp.email },
          data: {
            name: emp.name,
            phone: emp.phone,
            isActive: true,
          },
        });
        log(`  ✅ ${emp.name} updated`, 'success');
        testUsers.push(updated);
        continue;
      }
    }

    const created = await prisma.user.create({
      data: {
        ...emp,
        password: await bcrypt.hash('password123', 10),
        isActive: true,
      },
    });
    log(`  ✅ ${emp.name} created`, 'success');
    testUsers.push(created);
  }

  // Create 2 drivers
  const drivers = [
    {
      email: 'driver.joko@bi.go.id',
      name: 'Joko Susanto',
      phone: '081234567892',
      role: UserRole.DRIVER,
    },
    {
      email: 'driver.dedi@bi.go.id',
      name: 'Dedi Kurniawan',
      phone: '081234567893',
      role: UserRole.DRIVER,
    },
  ];

  for (const driver of drivers) {
    const exists = await prisma.user.findUnique({
      where: { email: driver.email },
    });

    if (exists) {
      if (!force) {
        log(`  ⏭️  ${driver.name} already exists`, 'warn');
        testUsers.push(exists);
        continue;
      } else {
        // Update if force flag is set
        const updated = await prisma.user.update({
          where: { email: driver.email },
          data: {
            name: driver.name,
            phone: driver.phone,
            isActive: true,
          },
        });
        log(`  ✅ ${driver.name} updated`, 'success');
        testUsers.push(updated);
        continue;
      }
    }

    const created = await prisma.user.create({
      data: {
        ...driver,
        password: await bcrypt.hash('password123', 10),
        isActive: true,
      },
    });
    log(`  ✅ ${driver.name} created`, 'success');
    testUsers.push(created);
  }

  return testUsers;
}

async function seedBookings(
  prisma: PrismaClient,
  log: (message: string, type: string) => void,
  force: boolean,
  users: any[],
  vehicles: any[]
) {
  const bookingCount = await prisma.booking.count();

  if (bookingCount > 0 && !force) {
    log(`⏭️  ${bookingCount} bookings already exist, skipping...`, 'warn');
    return;
  }

  log(`📋 Creating test bookings...`, 'info');

  const BookingStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    DEPARTED: 'DEPARTED',
    ARRIVED: 'ARRIVED',
    RETURNING: 'RETURNING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  };

  const statuses = Object.values(BookingStatus);
  
  try {
    for (let i = 0; i < 5; i++) {
      const employee = users[i % 2]; // Alternate between employees
      const driver = users[2 + (i % 2)]; // Alternate between drivers
      const vehicle = vehicles[i % vehicles.length];
      const status = statuses[i % statuses.length];

      await prisma.booking.create({
        data: {
          employeeId: employee.id,
          driverId: driver.id,
          vehicleId: vehicle.id,
          pickupLocation: `Lokasi Jemput ${i + 1}`,
          destination: `Tujuan ${i + 1}`,
          bookingDate: new Date(),
          bookingTime: `${9 + i}:00`,
          status: status as any,
          notes: `Test booking ${i + 1}`,
        },
      });
    }
    log(`  ✅ 5 test bookings created`, 'success');
  } catch (error) {
    log(`  ⚠️  Error creating bookings: ${error instanceof Error ? error.message : 'Unknown'}`, 'warn');
  }
}

async function seedWhatsAppConfig(
  prisma: PrismaClient,
  log: (message: string, type: string) => void,
  force: boolean
) {
  const configExists = await prisma.whatsAppConfig.findFirst();

  if (configExists && !force) {
    log(`⏭️  WhatsApp configuration already exists, skipping...`, 'warn');
    return;
  }

  log(`📱 Creating WhatsApp configuration...`, 'info');

  const config = {
    deviceId: process.env.WA_DEVICE_ID || 'default-device-id',
    apiUrl: process.env.WA_API_URL || 'https://app.whacenter.com/api',
    isActive: true,
  };

  if (configExists && force) {
    await prisma.whatsAppConfig.update({
      where: { id: configExists.id },
      data: config,
    });
    log(`✅ WhatsApp config updated`, 'success');
  } else {
    await prisma.whatsAppConfig.create({ data: config });
    log(`✅ WhatsApp config created`, 'success');
  }
}

async function seedWhatsAppTemplates(
  prisma: PrismaClient,
  log: (message: string, type: string) => void,
  force: boolean
) {
  const templateCount = await prisma.whatsAppTemplate.count();

  if (templateCount > 0 && !force) {
    log(`⏭️  ${templateCount} WhatsApp templates already exist, skipping...`, 'warn');
    return;
  }

  log(`💬 Creating WhatsApp templates...`, 'info');

  const templates = [
    {
      name: 'BOOKING_CONFIRMATION',
      type: 'BOOKING',
      content: 'Booking Anda nomor {{bookingId}} telah dikonfirmasi. Armada: {{vehicleName}}, Jadwal: {{schedule}}',
      isActive: true,
    },
    {
      name: 'BOOKING_COMPLETED',
      type: 'COMPLETED',
      content: 'Perjalanan Anda telah selesai. Terima kasih telah menggunakan layanan kami!',
      isActive: true,
    },
    {
      name: 'BOOKING_CANCELLED',
      type: 'CANCELLED',
      content: 'Booking Anda telah dibatalkan. Hubungi admin untuk informasi lebih lanjut.',
      isActive: true,
    },
  ];

  for (const template of templates) {
    const exists = await prisma.whatsAppTemplate.findUnique({
      where: { name: template.name },
    });

    if (exists && !force) {
      log(`  ⏭️  ${template.name} already exists`, 'warn');
      continue;
    }

    if (exists && force) {
      await prisma.whatsAppTemplate.update({
        where: { name: template.name },
        data: template,
      });
      log(`  ✅ ${template.name} updated`, 'success');
    } else {
      await prisma.whatsAppTemplate.create({ data: template });
      log(`  ✅ ${template.name} created`, 'success');
    }
  }
}

// Run seeding
const isForce = process.argv.includes('--force');
const isQuiet = process.argv.includes('--quiet');

seedProduction({
  force: isForce,
  verbose: !isQuiet,
}).catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
