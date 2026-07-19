export interface Venue {
  id: string;
  title: string;
  location: string;
  price: string;
  rating: string;
  status: string;
  statusColor: string;
  features: string[];
  image: string;
  tags: string[];
  category: string;
  description?: string;
  openHours?: string;
  courts?: Court[];
}

export interface Court {
  id: string;
  name: string;
  type: string;
  price: string;
  available: boolean;
}

export interface Booking {
  id: string;
  venue: Venue;
  court: Court;
  date: string;
  time: string;
  duration: number;
  totalPrice: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  ticketCode: string;
  qrData: string;
}

export const ALL_VENUES: Venue[] = [
  {
    id: '1',
    title: 'Kinetic Stadium',
    location: 'Jakarta Selatan',
    price: 'Rp150.000',
    rating: '4.8',
    status: 'Tersedia',
    statusColor: '#00A651',
    features: ['WiFi', 'Parkir', 'Kantin', 'Shower'],
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
    tags: ['Futsal', 'Indoor'],
    category: 'Futsal',
    description: 'Stadium futsal premium dengan fasilitas lengkap dan lapangan berkualitas tinggi.',
    openHours: '06:00 - 22:00',
    courts: [
      { id: 'c1', name: 'Lapangan A', type: 'Futsal', price: 'Rp150.000', available: true },
      { id: 'c2', name: 'Lapangan B', type: 'Futsal', price: 'Rp150.000', available: true },
      { id: 'c3', name: 'Lapangan VIP', type: 'Futsal', price: 'Rp250.000', available: false },
    ],
  },
  {
    id: '2',
    title: 'Senayan Field Center',
    location: 'Jakarta Pusat',
    price: 'Rp210.000',
    rating: '4.6',
    status: 'Diskon 10%',
    statusColor: '#BA1A1A',
    features: ['WiFi', 'Parkir', 'Shower', 'Gym'],
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop',
    tags: ['Mini Soccer', 'Outdoor'],
    category: 'Mini Soccer',
    description: 'Pusat olahraga dengan lapangan mini soccer terbaik di Jakarta Pusat.',
    openHours: '05:00 - 21:00',
    courts: [
      { id: 'c4', name: 'Lapangan Utama', type: 'Mini Soccer', price: 'Rp210.000', available: true },
      { id: 'c5', name: 'Lapangan Latihan', type: 'Mini Soccer', price: 'Rp180.000', available: true },
    ],
  },
  {
    id: '3',
    title: 'Gor Manahan',
    location: 'Jakarta Timur',
    price: 'Rp75.000',
    rating: '4.5',
    status: 'Tersedia',
    statusColor: '#00A651',
    features: ['AC', 'Kantin', 'Parkir'],
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    tags: ['Badminton', 'Indoor'],
    category: 'Badminton',
    description: 'Gor badminton dengan 6 lapangan dan fasilitas berpendingin ruangan.',
    openHours: '07:00 - 22:00',
    courts: [
      { id: 'c6', name: 'Lapangan 1', type: 'Badminton', price: 'Rp75.000', available: true },
      { id: 'c7', name: 'Lapangan 2', type: 'Badminton', price: 'Rp75.000', available: true },
      { id: 'c8', name: 'Lapangan 3', type: 'Badminton', price: 'Rp75.000', available: true },
    ],
  },
  {
    id: '4',
    title: 'Lapangan Tugu',
    location: 'Bandung',
    price: 'Rp120.000',
    rating: '4.7',
    status: 'Tersedia',
    statusColor: '#00A651',
    features: ['WiFi', 'Parkir', 'Teras'],
    image: 'https://images.unsplash.com/photo-1529926706528-db9e5010cd3e?q=80&w=800&auto=format&fit=crop',
    tags: ['Basket', 'Outdoor'],
    category: 'Basket',
    description: 'Lapangan basket outdoor dengan view gunung yang menakjubkan.',
    openHours: '06:00 - 20:00',
    courts: [
      { id: 'c9', name: 'Lapangan Utama', type: 'Basket', price: 'Rp120.000', available: true },
    ],
  },
  {
    id: '5',
    title: 'Arena Sport',
    location: 'Jakarta Barat',
    price: 'Rp180.000',
    rating: '4.4',
    status: 'Penuh',
    statusColor: '#f97316',
    features: ['Parkir', 'Kantin', 'Ruang Ganti'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=800&auto=format&fit=crop',
    tags: ['Tenis', 'Indoor'],
    category: 'Tenis',
    description: 'Arena tenis indoor berstandar internasional.',
    openHours: '06:00 - 22:00',
    courts: [
      { id: 'c10', name: 'Lapangan A', type: 'Tenis', price: 'Rp180.000', available: false },
      { id: 'c11', name: 'Lapangan B', type: 'Tenis', price: 'Rp180.000', available: false },
    ],
  },
  {
    id: '6',
    title: 'Gelora Arena',
    location: 'Surabaya',
    price: 'Rp250.000',
    rating: '4.9',
    status: 'Tersedia',
    statusColor: '#00A651',
    features: ['WiFi', 'Parkir', 'VIP Lounge'],
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop',
    tags: ['Futsal', 'Mini Soccer', 'Indoor'],
    category: 'Futsal',
    description: 'Arena olahraga premium dengan fasilitas VIP dan lapangan berstandar tinggi.',
    openHours: '05:00 - 23:00',
    courts: [
      { id: 'c12', name: 'Lapangan Premium', type: 'Futsal', price: 'Rp250.000', available: true },
      { id: 'c13', name: 'Lapangan Reguler', type: 'Futsal', price: 'Rp180.000', available: true },
    ],
  },
];

export const ALL_REKOMENDASI = [
  { id: '3', name: 'Gor Manahan', distance: '2.1 km', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop' },
  { id: '4', name: 'Lapangan Tugu', distance: '3.4 km', image: 'https://images.unsplash.com/photo-1529926706528-db9e5010cd3e?q=80&w=800&auto=format&fit=crop' },
  { id: '5', name: 'Arena Sport', distance: '4.0 km', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=800&auto=format&fit=crop' },
  { id: '6', name: 'Gelora Arena', distance: '5.2 km', image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop' },
];

export const CATEGORIES = [
  { label: 'Futsal', icon: 'sports-soccer' as const },
  { label: 'Badminton', icon: 'sports-tennis' as const },
  { label: 'Basket', icon: 'sports-basketball' as const },
  { label: 'Mini Soccer', icon: 'sports-soccer' as const },
  { label: 'Tenis', icon: 'sports-tennis' as const },
];

export function generateBooking(venue: Venue, court: Court, date: string, time: string): Booking {
  const code = 'GOAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  return {
    id: Date.now().toString(),
    venue,
    court,
    date,
    time,
    duration: 1,
    totalPrice: court.price + '/jam',
    status: 'upcoming',
    ticketCode: code,
    qrData: `https://goal.app/ticket/${code}`,
  };
}
