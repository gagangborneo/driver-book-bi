// Dummy data store (in-memory) for SI-LAMIN
// This will be reset on server restart
// Last updated: 2024

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string | null;
  role: 'ADMIN' | 'EMPLOYEE' | 'DRIVER';
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  assignedToId: string | null;
}

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface Booking {
  id: string;
  employeeId: string;
  driverId: string | null;
  vehicleId: string | null;
  pickupLocation: string;
  destination: string;
  bookingDate: Date;
  bookingTime: string;
  status: 'PENDING' | 'APPROVED' | 'DEPARTED' | 'ARRIVED' | 'RETURNING' | 'COMPLETED' | 'CANCELLED';
  startOdometer: number | null;
  endOdometer: number | null;
  startedAt: Date | null;
  departedAt: Date | null;
  arrivedAt: Date | null;
  returningAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  // Location coordinates
  pickupCoords: Location | null;
  destinationCoords: Location | null;
  currentCoords: Location | null;
}

export interface LogBook {
  id: string;
  driverId: string;
  vehicleId: string;
  type: 'WASHING' | 'SERVICE' | 'FUEL' | 'OTHER';
  description: string;
  date: Date;
  cost: number | null;
  odometer: number | null;
  createdAt: Date;
}

// Initial Users
export const users: User[] = [
  { id: '1', email: 'admin@bi.go.id', password: 'password123', name: 'Ahmad Admin', phone: '081234567890', role: 'ADMIN', isActive: true },
  { id: '2', email: 'budi.santoso@bi.go.id', password: 'password123', name: 'Budi Santoso', phone: '081234567891', role: 'EMPLOYEE', isActive: true },
  { id: '3', email: 'siti.rahayu@bi.go.id', password: 'password123', name: 'Siti Rahayu', phone: '081234567892', role: 'EMPLOYEE', isActive: true },
  { id: '4', email: 'agus.wibowo@bi.go.id', password: 'password123', name: 'Agus Wibowo', phone: '081234567893', role: 'EMPLOYEE', isActive: true },
  { id: '5', email: 'driver.joko@bi.go.id', password: 'password123', name: 'Joko Susanto', phone: '081234567894', role: 'DRIVER', isActive: true },
  { id: '6', email: 'driver.dedi@bi.go.id', password: 'password123', name: 'Dedi Kurniawan', phone: '081234567895', role: 'DRIVER', isActive: true },
  { id: '7', email: 'driver.rudi@bi.go.id', password: 'password123', name: 'Rudi Hermawan', phone: '081234567896', role: 'DRIVER', isActive: true },
];

// Initial Vehicles (3 vehicles for 3 drivers)
export const vehicles: Vehicle[] = [
  { id: 'v1', plateNumber: 'B 1234 BI', brand: 'Toyota', model: 'Innova', year: 2022, color: 'Hitam', status: 'AVAILABLE', assignedToId: '5' },
  { id: 'v2', plateNumber: 'B 5678 BI', brand: 'Honda', model: 'CR-V', year: 2023, color: 'Putih', status: 'AVAILABLE', assignedToId: '6' },
  { id: 'v3', plateNumber: 'B 9012 BI', brand: 'Mitsubishi', model: 'Pajero', year: 2021, color: 'Silver', status: 'AVAILABLE', assignedToId: '7' },
];

// Bookings storage
export const bookings: Booking[] = [];

// LogBooks storage
export const logBooks: LogBook[] = [];

// Helper to generate IDs
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Jakarta area coordinates for dummy locations
export const JAKARTA_LOCATIONS: Record<string, Location> = {
  'Kantor BI Jakarta': { lat: -6.1751, lng: 106.8248, name: 'Kantor BI Jakarta' },
  'Bandara Soekarno-Hatta': { lat: -6.1256, lng: 106.6559, name: 'Bandara Soekarno-Hatta' },
  'Gedung DPR': { lat: -6.2088, lng: 106.8007, name: 'Gedung DPR' },
  'Istana Merdeka': { lat: -6.1699, lng: 106.8264, name: 'Istana Merdeka' },
  'Monas': { lat: -6.1754, lng: 106.8272, name: 'Monas' },
  'Kantor BI Surabaya': { lat: -7.2575, lng: 112.7521, name: 'Kantor BI Surabaya' },
  'Hotel Indonesia': { lat: -6.1952, lng: 106.8232, name: 'Hotel Indonesia' },
  'GBK Senayan': { lat: -6.2182, lng: 106.8071, name: 'GBK Senayan' },
};
