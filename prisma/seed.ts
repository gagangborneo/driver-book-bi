import { PrismaClient, UserRole, VehicleStatus, LogBookType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@bi.go.id' },
      update: {},
      create: {
        email: 'admin@bi.go.id',
        password: await bcrypt.hash('password123', 10),
        name: 'Ahmad Admin',
        phone: '081234567890',
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'budi.santoso@bi.go.id' },
      update: {},
      create: {
        email: 'budi.santoso@bi.go.id',
        password: await bcrypt.hash('password123', 10),
        name: 'Budi Santoso',
        phone: '081234567891',
        role: UserRole.EMPLOYEE,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'siti.rahayu@bi.go.id' },
      update: {},
      create: {
        email: 'siti.rahayu@bi.go.id',
        password: await bcrypt.hash('password123', 10),
        name: 'Siti Rahayu',
        phone: '081234567892',
        role: UserRole.EMPLOYEE,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'agus.wibowo@bi.go.id' },
      update: {},
      create: {
        email: 'agus.wibowo@bi.go.id',
        password: await bcrypt.hash('password123', 10),
        name: 'Agus Wibowo',
        phone: '081234567893',
        role: UserRole.EMPLOYEE,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'driver.joko@bi.go.id' },
      update: {},
      create: {
        email: 'driver.joko@bi.go.id',
        password: await bcrypt.hash('password123', 10),
        name: 'Joko Susanto',
        phone: '081234567894',
        role: UserRole.DRIVER,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'driver.dedi@bi.go.id' },
      update: {},
      create: {
        email: 'driver.dedi@bi.go.id',
        password: await bcrypt.hash('password123', 10),
        name: 'Dedi Kurniawan',
        phone: '081234567895',
        role: UserRole.DRIVER,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'driver.rudi@bi.go.id' },
      update: {},
      create: {
        email: 'driver.rudi@bi.go.id',
        password: await bcrypt.hash('password123', 10),
        name: 'Rudi Hermawan',
        phone: '081234567896',
        role: UserRole.DRIVER,
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plateNumber: 'B 1234 BI' },
      update: {},
      create: {
        plateNumber: 'B 1234 BI',
        brand: 'Toyota',
        model: 'Innova',
        year: 2022,
        color: 'Hitam',
        status: VehicleStatus.AVAILABLE,
        assignedToId: users[4].id, // Joko Susanto
      },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: 'B 5678 BI' },
      update: {},
      create: {
        plateNumber: 'B 5678 BI',
        brand: 'Honda',
        model: 'CR-V',
        year: 2023,
        color: 'Putih',
        status: VehicleStatus.AVAILABLE,
        assignedToId: users[5].id, // Dedi Kurniawan
      },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: 'B 9012 BI' },
      update: {},
      create: {
        plateNumber: 'B 9012 BI',
        brand: 'Mitsubishi',
        model: 'Pajero',
        year: 2021,
        color: 'Silver',
        status: VehicleStatus.AVAILABLE,
        assignedToId: users[6].id, // Rudi Hermawan
      },
    }),
  ]);

  console.log(`Created ${vehicles.length} vehicles`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
