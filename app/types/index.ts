// User types
export type UserRole = 'user' | 'admin' | 'agent' | 'support';

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Wallet types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'wallet' | 'cash';
export type PaymentProvider = 'stripe' | 'mercadopago' | 'mock';

export interface Payment {
  id: string;
  userId: string;
  sessionId?: string;
  requestId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerPaymentId?: string;
  status: PaymentStatus;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'transfer';

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Parking types
export interface ParkingSession {
  id: string;
  userId: string;
  vehicleId: string;
  meterId: string;
  zoneId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  rate: number;
  totalCost: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ParkingMeter {
  id: string;
  number: string;
  zoneId: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'occupied' | 'out_of_service';
  metadata?: Record<string, any>;
}

export interface ParkingZone {
  id: string;
  name: string;
  description?: string;
  hourlyRate: number;
  currency: string;
  color: string;
  isActive: boolean;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// Cart & POS types
export interface CartItem {
  service: Service;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  currency: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth types
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  totalBalance: number;
  totalTransactions: number;
  activeServices: number;
  monthlySpending: number;
  recentTransactions: Transaction[];
}
