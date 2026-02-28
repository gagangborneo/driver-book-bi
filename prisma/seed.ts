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

  // Create bookings without GPS coordinates
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        employeeId: users[1].id, // Budi Santoso
        driverId: users[4].id, // Joko Susanto
        vehicleId: vehicles[0].id,
        pickupLocation: 'Kantor Pusat BI, Jl. MH Thamrin',
        destination: 'Gedung Perwakilan BI, Jl. Sudirman',
        bookingDate: new Date(),
        bookingTime: '09:00',
        status: 'APPROVED',
        notes: 'Pengiriman dokumen penting',
      },
    }),
    prisma.booking.create({
      data: {
        employeeId: users[2].id, // Siti Rahayu
        driverId: users[5].id, // Dedi Kurniawan
        vehicleId: vehicles[1].id,
        pickupLocation: 'Hotel Mandarin Oriental, Jl. Gajah Mada',
        destination: 'Grand Indonesia, Jl. MH Thamrin',
        bookingDate: new Date(),
        bookingTime: '14:00',
        status: 'PENDING',
        notes: 'Jangan terlambat',
      },
    }),
  ]);

  console.log(`Created ${bookings.length} bookings`);

  // Seed WhatsApp Configuration
  const whatsappConfig = await prisma.whatsAppConfig.upsert({
    where: { deviceId: 'e6683d05a9bfa0f2ca6087857cff17ed' },
    update: {},
    create: {
      deviceId: 'e6683d05a9bfa0f2ca6087857cff17ed',
      apiUrl: 'https://app.whacenter.com/api',
      isActive: true,
    },
  });

  console.log('Created WhatsApp configuration');

  // Seed WhatsApp Routes/Groups
  const whatsappRoutes = await Promise.all([
    prisma.whatsAppRoute.upsert({
      where: { name: 'Driver Notifications' },
      update: {},
      create: {
        name: 'Driver Notifications',
        groupId: 'WAGDriver',
        description: 'Group untuk notifikasi driver tentang pesanan baru',
        isActive: true,
      },
    }),
    prisma.whatsAppRoute.upsert({
      where: { name: 'Management Group' },
      update: {},
      create: {
        name: 'Management Group',
        groupId: 'WAGManagement',
        description: 'Group untuk komunikasi manajemen',
        isActive: true,
      },
    }),
    prisma.whatsAppRoute.upsert({
      where: { name: 'Employee Notifications' },
      update: {},
      create: {
        name: 'Employee Notifications',
        groupId: 'WAGEmployee',
        description: 'Notifikasi untuk karyawan',
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${whatsappRoutes.length} WhatsApp routes`);

  // Seed WhatsApp Templates
  const whatsappTemplates = await Promise.all([
    prisma.whatsAppTemplate.upsert({
      where: { name: 'New Booking Alert' },
      update: {},
      create: {
        name: 'New Booking Alert',
        type: 'BOOKING',
        content: `🚗 Pesanan Driver Baru Masuk!

📍 Jemput: {pickupLocation}
📍 Tujuan: {destination}
⏰ Waktu: {bookingTime}
👤 Pengguna: {employeeName}

Segera cek aplikasi: {appUrl}`,
        isActive: true,
      },
    }),
    prisma.whatsAppTemplate.upsert({
      where: { name: 'Booking Accepted' },
      update: {},
      create: {
        name: 'Booking Accepted',
        type: 'ACCEPTED',
        content: `✅ Pesanan Diterima!

Driver: {driverName}
Kendaraan: {vehiclePlateNo}

Status: {status}
Pantau perjalanan: {appUrl}`,
        isActive: true,
      },
    }),
    prisma.whatsAppTemplate.upsert({
      where: { name: 'Trip Completed' },
      update: {},
      create: {
        name: 'Trip Completed',
        type: 'COMPLETED',
        content: `✓ Perjalanan Selesai!

Driver: {driverName}
Lokasi Akhir: {destination}
Waktu Selesai: {completedTime}

Terima kasih telah menggunakan layanan kami.`,
        isActive: true,
      },
    }),
    prisma.whatsAppTemplate.upsert({
      where: { name: 'Booking Cancelled' },
      update: {},
      create: {
        name: 'Booking Cancelled',
        type: 'CANCELLED',
        content: `❌ Pesanan Dibatalkan

Alasan: {cancellationReason}
Waktu: {cancelledTime}

Silakan hubungi admin jika ada pertanyaan.`,
        isActive: true,
      },
    }),
    prisma.whatsAppTemplate.upsert({
      where: { name: 'Booking Reminder' },
      update: {},
      create: {
        name: 'Booking Reminder',
        type: 'REMINDER',
        content: `⏰ Pengingat Pesanan

Pesanan Anda dijadwalkan:
📍 Dari: {pickupLocation}
📍 Ke: {destination}
⏰ Waktu: {bookingTime}

Harap siap tepat waktu. Hubungi kami jika ada perubahan.`,
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${whatsappTemplates.length} WhatsApp templates`);

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
