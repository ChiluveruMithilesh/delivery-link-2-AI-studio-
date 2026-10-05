export type UserRole = 'distributor' | 'driver' | 'shopkeeper' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type VehicleType = 'auto' | 'mini_truck' | 'pickup' | 'tempo';
export type UnitType = 'cartons' | 'bags' | 'tins' | 'boxes';
export type TripStatus = 'draft' | 'published' | 'assigned' | 'pickup_confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type StopStatus = 'pending' | 'en_route' | 'arrived' | 'delivered' | 'failed' | 'skipped';
export type BidStatus = 'offered' | 'countered' | 'accepted' | 'rejected' | 'withdrawn';

export interface CargoPackageItem {
  id: string;
  description: string;
  quantity: number;
  unitType: UnitType;
}

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string;
  userCode: string;
  preferredLanguage: string;
  password?: string;
  avatarUrl?: string;
  businessName?: string;
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  verificationStatus?: VerificationStatus;
}

export interface RegisteredShop {
  code: string; // e.g. 'SHP-101'
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  typicalItems?: string;
}

export interface PersonalizedRouteLeg {
  fromLabel: string; // e.g. 'Place A'
  fromName: string; // e.g. 'Begum Bazar Godown'
  toLabel: string; // e.g. 'Place B'
  toName: string; // e.g. 'Sri Balaji Kirana'
  toCode?: string; // e.g. 'SHP-101'
  distanceKm: number;
  durationMin: number;
  instructions: string;
}

export interface PersonalizedRoutePlan {
  totalDistanceKm: number;
  totalDurationMin: number;
  unoptimizedDistanceKm?: number;
  distanceSavedKm?: number;
  timeSavedMin?: number;
  legs: PersonalizedRouteLeg[];
}

export interface TripStop {
  id: string;
  tripId: string;
  sequenceNumber: number;
  placeLabel?: string; // e.g. 'Place B', 'Place C', ...
  shopkeeperCode: string; // Unique Code entered by distributor
  shopName: string;
  shopkeeperName?: string;
  shopkeeperPhone: string;
  address: string;
  lat: number;
  lng: number;
  itemsDescription?: string; // Specific FMCG items to send to this shopkeeper
  cargoPackages?: CargoPackageItem[]; // Multiple items (cartons, bags, tins) for the same shop
  quantity: number;
  unitType: UnitType;
  weightKg?: number;
  notes?: string;
  distanceFromPrevKm?: number;
  status: StopStatus;
  deliveryOtp: string;
  otpGenerated?: boolean;
  signedBillPhotoUrl?: string;
  signedBillUploadedAt?: string;
  signedBillFileName?: string;
  billChecked?: boolean;
  shopkeeperSignature?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  proofPhotoUrl?: string;
}

export interface TripBid {
  id: string;
  tripId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  driverVehicleNumber: string;
  offeredAmount: number;
  status: BidStatus;
  createdAt: string;
}

export interface Trip {
  id: string;
  distributorId: string;
  distributorName: string;
  distributorPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicleNumber?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  goodsDescription: string;
  totalQuantity: number;
  goodsValue: number;
  paymentOffered: number;
  status: TripStatus;
  totalStops: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  routePlan?: PersonalizedRoutePlan;
  stops: TripStop[];
  bids?: TripBid[];
  currentDriverLat?: number;
  currentDriverLng?: number;
  driverSpeedKmh?: number;
  publishedAt?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface OrderRequest {
  id: string;
  shopkeeperId: string;
  shopkeeperName: string;
  shopName: string;
  contactNumber: string;
  address: string;
  distributorId: string;
  distributorName: string;
  itemsDescription: string;
  quantity: number;
  unitType: UnitType;
  urgency: 'normal' | 'urgent' | 'same_day';
  status: 'pending' | 'accepted' | 'declined' | 'assigned_to_trip';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'trip' | 'bid' | 'delivery' | 'order' | 'system';
}

export interface DriverVerificationRecord {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  drivingLicenceNumber: string;
  aadhaarNumber: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleCapacityKg: number;
  verificationStatus: VerificationStatus;
  appliedDate: string;
}
