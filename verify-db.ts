import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function verify() {
  console.log('✅ DATABASE VERIFICATION\n');
  
  try {
    // Users
    const totalUsers = await db.user.count();
    const admins = await db.user.count({ where: { role: 'ADMIN' } });
    const employees = await db.user.count({ where: { role: 'EMPLOYEE' } });
    const drivers = await db.user.count({ where: { role: 'DRIVER' } });
    
    console.log('👥 USERS:');
    console.log(`   Total: ${totalUsers}`);
    console.log(`   - Admins: ${admins}`);
    console.log(`   - Employees: ${employees}`);
    console.log(`   - Drivers: ${drivers}\n`);
    
    // Admin details
    const admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      console.log('🔐 ADMIN USER:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Phone: ${admin.phone}\n`);
    }
    
    // Vehicles
    const totalVehicles = await db.vehicle.count();
    const vehicles = await db.vehicle.findMany();
    console.log('🚗 VEHICLES:');
    console.log(`   Total: ${totalVehicles}`);
    vehicles.forEach(v => {
      console.log(`   - ${v.plateNumber} (${v.brand} ${v.model})`);
    });
    console.log();
    
    // Bookings
    const totalBookings = await db.booking.count();
    const pending = await db.booking.count({ where: { status: 'PENDING' } });
    const approved = await db.booking.count({ where: { status: 'APPROVED' } });
    const completed = await db.booking.count({ where: { status: 'COMPLETED' } });
    
    console.log('📋 BOOKINGS:');
    console.log(`   Total: ${totalBookings}`);
    console.log(`   - Pending: ${pending}`);
    console.log(`   - Approved: ${approved}`);
    console.log(`   - Completed: ${completed}\n`);
    
    // WhatsApp
    const waConfigs = await db.whatsAppConfig.count();
    const waTemplates = await db.whatsAppTemplate.count();
    console.log('💬 WHATSAPP:');
    console.log(`   Configurations: ${waConfigs}`);
    console.log(`   Templates: ${waTemplates}\n`);
    
    console.log('✅ All data verified successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await db.$disconnect();
  }
}

verify();
