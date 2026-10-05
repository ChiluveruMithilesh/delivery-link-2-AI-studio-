import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Trip, TripStop, UnitType } from '../types';
import { REGISTERED_SHOPS, lookupShopkeeperByCode, searchShopkeepers } from '../data/registeredShops';
import { optimizeRoutePlan, getPlaceLabel } from '../utils/routeOptimizer';
import { downloadPhotograph } from '../utils/billGenerator';
import { AutoDriverPathTracker } from './AutoDriverPathTracker';
import {
  Plus,
  Package,
  MapPin,
  Clock,
  IndianRupee,
  Store,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Truck,
  Trash2,
  Send,
  FileText,
  UserCheck,
  Zap,
  Navigation,
  Compass,
  Sparkles,
  ArrowUpDown,
  Search,
  ListPlus,
  Info,
  Maximize2,
  Edit3,
  AlertTriangle,
  X,
  RotateCcw,
  Download,
  Eye,
  ShieldCheck,
  FileCheck2,
  Camera,
} from 'lucide-react';

export interface CargoPackageDraft {
  id: string;
  description: string;
  quantity: number;
  unitType: 'cartons' | 'bags' | 'tins';
}

interface StopDraft {
  shopkeeperCode: string;
  shopName: string;
  shopkeeperName: string;
  shopkeeperPhone: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  itemsDescription: string;
  cargoPackages: CargoPackageDraft[];
  quantity: number;
  unitType: UnitType;
  notes: string;
  placeLabel: string;
}

export const DistributorView: React.FC = () => {
  const {
    trips,
    createTrip,
    updateTrip,
    deleteTrip,
    orders,
    updateOrderStatus,
    currentUser,
    updateDriverLocation,
  } = useApp();
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    // Prefer in_progress or assigned trip by default
    const active = trips.find((t) => t.status === 'in_progress' || t.status === 'assigned');
    return active?.id || trips[0]?.id || '';
  });
  const [activeTab, setActiveTab] = useState<'live' | 'trips' | 'create' | 'orders'>('trips');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'published' | 'assigned' | 'completed'>('all');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [viewingProofStop, setViewingProofStop] = useState<TripStop | null>(null);
  const [expandedTripStopsId, setExpandedTripStopsId] = useState<string | null>(null);

  const tripBuilderRef = useRef<HTMLFormElement | null>(null);

  const handleOpenTripBuilder = () => {
    setActiveTab('create');
    setTimeout(() => {
      if (tripBuilderRef.current) {
        tripBuilderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const el = document.getElementById('trip-builder-form');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 60);
  };

  const handleTrackTripLive = (tripId: string) => {
    setSelectedTripId(tripId);
    setActiveTab('live');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form state for creating trip
  const [pickupAddress, setPickupAddress] = useState('Godown #14, Wholesale Market, Begum Bazar, Hyderabad');
  const [pickupLat, setPickupLat] = useState(17.3753);
  const [pickupLng, setPickupLng] = useState(78.4744);
  const [goodsValue, setGoodsValue] = useState(65000);
  const [paymentOffered, setPaymentOffered] = useState(1250);

  // Autocomplete code search for adding a new stop
  const [codeInput, setCodeInput] = useState('');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [activeCodeDropdownIdx, setActiveCodeDropdownIdx] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [justAddedShopCode, setJustAddedShopCode] = useState<string | null>(null);
  const [stopAddedNotification, setStopAddedNotification] = useState<{ name: string; stopNum: number } | null>(null);

  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const stopsListContainerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  // Bulk add modal/input
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCodesText, setBulkCodesText] = useState('');

  // Stops list: up to 40 shops
  const [stops, setStops] = useState<StopDraft[]>([
    {
      shopkeeperCode: 'SHP-101',
      shopName: 'Sri Balaji Kirana & Provisions',
      shopkeeperName: 'Venkat Reddy',
      shopkeeperPhone: '+91 94401 67890',
      address: 'Shop #3, Koti Main Road, Opposite Andhra Bank',
      locality: 'Koti',
      lat: 17.3850,
      lng: 78.4867,
      cargoPackages: [
        { id: 'pkg-101-1', description: 'Parle-G Glucose Biscuits', quantity: 15, unitType: 'cartons' },
        { id: 'pkg-101-2', description: 'Britannia Good Day Butter Cookies', quantity: 10, unitType: 'cartons' },
      ],
      itemsDescription: '15 cartons of Parle-G • 10 cartons of Britannia Good Day',
      quantity: 25,
      unitType: 'cartons',
      notes: 'Deliver before 12 PM',
      placeLabel: 'Place B',
    },
    {
      shopkeeperCode: 'SHP-102',
      shopName: 'Lakshmi Super Mart & General Store',
      shopkeeperName: 'Lakshmi Narayana',
      shopkeeperPhone: '+91 98492 33445',
      address: 'Plot 12, Sultan Bazar X Roads',
      locality: 'Sultan Bazar',
      lat: 17.3915,
      lng: 78.4890,
      cargoPackages: [
        { id: 'pkg-102-1', description: 'Tata Tea Gold Leaf', quantity: 12, unitType: 'bags' },
        { id: 'pkg-102-2', description: 'Surf Excel Easy Wash Detergent', quantity: 8, unitType: 'cartons' },
      ],
      itemsDescription: '12 bags of Tata Tea Gold • 8 cartons of Surf Excel',
      quantity: 20,
      unitType: 'bags',
      notes: 'Call 10 mins before reaching',
      placeLabel: 'Place C',
    },
    {
      shopkeeperCode: 'SHP-103',
      shopName: 'Mahalaxmi Provision Store',
      shopkeeperName: 'Murali Mohan',
      shopkeeperPhone: '+91 97001 55667',
      address: 'Station Road, Beside Metro Pillar 18',
      locality: 'Kachiguda',
      lat: 17.3980,
      lng: 78.4975,
      cargoPackages: [
        { id: 'pkg-103-1', description: 'Aashirvaad Sharbati Atta', quantity: 10, unitType: 'bags' },
        { id: 'pkg-103-2', description: 'Fortune Refined Sunflower Oil (15L)', quantity: 5, unitType: 'tins' },
      ],
      itemsDescription: '10 bags of Aashirvaad Atta • 5 tins of Fortune Sunflower Oil',
      quantity: 15,
      unitType: 'tins',
      notes: 'Hand over invoice copy',
      placeLabel: 'Place D',
    },
  ]);

  // Helper to recompute stop quantity and composite description from its cargo packages
  const syncStopCargo = (packages: CargoPackageDraft[]): { quantity: number; unitType: UnitType; itemsDescription: string } => {
    const totalQty = packages.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const primaryUnit = packages[0]?.unitType || 'cartons';
    const desc = packages
      .map((p) => `${p.quantity || 1} ${p.unitType}${p.description?.trim() ? ` of ${p.description.trim()}` : ''}`)
      .join(' • ');

    return {
      quantity: totalQty || 1,
      unitType: primaryUnit,
      itemsDescription: desc,
    };
  };

  // Add a new package row (bags, cartons, tins) to a specific shop stop
  const handleAddPackageToStop = (stopIdx: number, defaultUnit: 'cartons' | 'bags' | 'tins' = 'bags') => {
    setStops((prev) => {
      const updated = [...prev];
      const targetStop = { ...updated[stopIdx] };
      const currentPkgs = targetStop.cargoPackages ? [...targetStop.cargoPackages] : [];

      const defaultDesc =
        defaultUnit === 'cartons'
          ? 'Parle-G / Britannia Biscuits'
          : defaultUnit === 'bags'
          ? 'Aashirvaad Atta / Rice Bags'
          : 'Fortune Sunflower Oil (15L)';

      currentPkgs.push({
        id: `pkg-${Date.now()}-${currentPkgs.length + 1}`,
        description: defaultDesc,
        quantity: 5,
        unitType: defaultUnit,
      });

      const synced = syncStopCargo(currentPkgs);
      updated[stopIdx] = {
        ...targetStop,
        cargoPackages: currentPkgs,
        quantity: synced.quantity,
        unitType: synced.unitType,
        itemsDescription: synced.itemsDescription,
      };

      return updated;
    });
  };

  // Update a package within a specific shop stop
  const handleUpdatePackage = (
    stopIdx: number,
    pkgIdx: number,
    updates: Partial<CargoPackageDraft>
  ) => {
    setStops((prev) => {
      const updated = [...prev];
      const targetStop = { ...updated[stopIdx] };
      const currentPkgs = targetStop.cargoPackages ? [...targetStop.cargoPackages] : [];

      if (!currentPkgs[pkgIdx]) return prev;

      currentPkgs[pkgIdx] = {
        ...currentPkgs[pkgIdx],
        ...updates,
      };

      const synced = syncStopCargo(currentPkgs);
      updated[stopIdx] = {
        ...targetStop,
        cargoPackages: currentPkgs,
        quantity: synced.quantity,
        unitType: synced.unitType,
        itemsDescription: synced.itemsDescription,
      };

      return updated;
    });
  };

  // Remove a package from a shop stop
  const handleRemovePackage = (stopIdx: number, pkgIdx: number) => {
    setStops((prev) => {
      const updated = [...prev];
      const targetStop = { ...updated[stopIdx] };
      const currentPkgs = targetStop.cargoPackages ? [...targetStop.cargoPackages] : [];

      if (currentPkgs.length <= 1) return prev; // Keep at least one item

      currentPkgs.splice(pkgIdx, 1);
      const synced = syncStopCargo(currentPkgs);
      updated[stopIdx] = {
        ...targetStop,
        cargoPackages: currentPkgs,
        quantity: synced.quantity,
        unitType: synced.unitType,
        itemsDescription: synced.itemsDescription,
      };

      return updated;
    });
  };

  // Compute total cargo quantity and description
  const totalCargoQuantity = useMemo(() => {
    return stops.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  }, [stops]);

  const compositeGoodsDescription = useMemo(() => {
    if (stops.length === 0) return 'Various FMCG goods';
    return stops.map((s) => s.itemsDescription || `${s.quantity} ${s.unitType}`).join(' • ');
  }, [stops]);

  // Route Plan (Rapido Minimum Distance calculation)
  const optimizationResult = useMemo(() => {
    const dummyStops: TripStop[] = stops.map((s, idx) => ({
      id: `draft-stop-${idx}`,
      tripId: '',
      sequenceNumber: idx + 1,
      placeLabel: s.placeLabel || getPlaceLabel(idx + 1),
      shopkeeperCode: s.shopkeeperCode,
      shopName: s.shopName,
      shopkeeperName: s.shopkeeperName,
      shopkeeperPhone: s.shopkeeperPhone,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      cargoPackages: s.cargoPackages,
      itemsDescription: s.itemsDescription,
      quantity: s.quantity,
      unitType: s.unitType,
      notes: s.notes,
      status: 'pending',
      deliveryOtp: '000000',
    }));

    return optimizeRoutePlan(pickupLat, pickupLng, pickupAddress, dummyStops);
  }, [stops, pickupLat, pickupLng, pickupAddress]);

  // Handle adding stop by unique code
  const handleAddStopByCode = (shopCode: string) => {
    if (stops.length >= 40) {
      alert('Maximum of 40 shops allowed per delivery trip.');
      setIsDropdownOpen(false);
      return;
    }

    const found = lookupShopkeeperByCode(shopCode);
    const stopIndex = stops.length + 1;
    const placeLabel = getPlaceLabel(stopIndex);

    let addedShopName = '';
    let targetCode = '';

    const initialPackages: CargoPackageDraft[] = found
      ? [
          {
            id: `pkg-${Date.now()}-1`,
            description: found.typicalItems ? found.typicalItems.split(',')[0].trim() : 'Parle-G & Britannia Biscuits',
            quantity: 8,
            unitType: 'cartons',
          },
          {
            id: `pkg-${Date.now()}-2`,
            description: 'Aashirvaad Atta / Rice Bags',
            quantity: 4,
            unitType: 'bags',
          },
        ]
      : [
          {
            id: `pkg-${Date.now()}-1`,
            description: 'Assorted FMCG Goods',
            quantity: 6,
            unitType: 'cartons',
          },
          {
            id: `pkg-${Date.now()}-2`,
            description: 'Atta & Commodity Essentials',
            quantity: 4,
            unitType: 'bags',
          },
        ];

    const initialCargo = syncStopCargo(initialPackages);

    if (found) {
      targetCode = found.code;
      addedShopName = found.shopName;
      const newStop: StopDraft = {
        shopkeeperCode: found.code,
        shopName: found.shopName,
        shopkeeperName: found.ownerName,
        shopkeeperPhone: found.phone,
        address: found.address,
        locality: found.locality,
        lat: found.lat,
        lng: found.lng,
        cargoPackages: initialPackages,
        itemsDescription: initialCargo.itemsDescription,
        quantity: initialCargo.quantity,
        unitType: initialCargo.unitType,
        notes: '',
        placeLabel,
      };
      setStops((prev) => [...prev, newStop]);
    } else {
      // Custom shop code
      const cleanCode = shopCode.trim().toUpperCase() || `SHP-${100 + stopIndex}`;
      targetCode = cleanCode;
      addedShopName = `Retail Kirana (${cleanCode})`;
      const newStop: StopDraft = {
        shopkeeperCode: cleanCode,
        shopName: addedShopName,
        shopkeeperName: 'Shopkeeper',
        shopkeeperPhone: '+91 98000 00000',
        address: 'Secunderabad Trade Market, Hyderabad',
        locality: 'Trade Hub',
        lat: 17.4399 + (Math.random() - 0.5) * 0.03,
        lng: 78.4983 + (Math.random() - 0.5) * 0.03,
        cargoPackages: initialPackages,
        itemsDescription: initialCargo.itemsDescription,
        quantity: initialCargo.quantity,
        unitType: initialCargo.unitType,
        notes: '',
        placeLabel,
      };
      setStops((prev) => [...prev, newStop]);
    }

    // Immediately close dropdown and clear inputs
    setIsDropdownOpen(false);
    setCodeInput('');
    setCodeSearchQuery('');
    setActiveCodeDropdownIdx(null);

    // Provide visual feedback and highlight the newly added stop
    setJustAddedShopCode(targetCode);
    setStopAddedNotification({ name: addedShopName, stopNum: stopIndex });

    setTimeout(() => {
      setStopAddedNotification(null);
    }, 4000);

    setTimeout(() => {
      setJustAddedShopCode(null);
    }, 2500);

    // Auto scroll smoothly to the new stop in the below list
    setTimeout(() => {
      if (stopsListContainerRef.current) {
        stopsListContainerRef.current.scrollTo({
          top: stopsListContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 80);
  };

  // Change stop code and auto-resolve shop info
  const handleUpdateStopCode = (idx: number, newCode: string) => {
    const found = lookupShopkeeperByCode(newCode);
    const updated = [...stops];
    if (found) {
      updated[idx] = {
        ...updated[idx],
        shopkeeperCode: found.code,
        shopName: found.shopName,
        shopkeeperName: found.ownerName,
        shopkeeperPhone: found.phone,
        address: found.address,
        locality: found.locality,
        lat: found.lat,
        lng: found.lng,
        itemsDescription: updated[idx].itemsDescription || found.typicalItems || '',
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        shopkeeperCode: newCode.toUpperCase(),
      };
    }
    setStops(updated);
  };

  // Quick Preset Batches: 5, 10, 20, 40 shops
  const handleLoadPresetBatch = (count: number) => {
    const selected = REGISTERED_SHOPS.slice(0, Math.min(count, 40));
    const newStops: StopDraft[] = selected.map((shop, idx) => {
      const qCartons = 6 + (idx % 4) * 2;
      const qBags = 4 + (idx % 3) * 2;
      const qTins = idx % 2 === 0 ? 2 + (idx % 3) : 0;

      const pkgs: CargoPackageDraft[] = [
        {
          id: `pkg-preset-${idx}-1`,
          description: shop.typicalItems ? shop.typicalItems.split(',')[0].trim() : 'Parle-G & Britannia Biscuits',
          quantity: qCartons,
          unitType: 'cartons',
        },
        {
          id: `pkg-preset-${idx}-2`,
          description: 'Aashirvaad Atta / Rice Bags',
          quantity: qBags,
          unitType: 'bags',
        },
      ];

      if (qTins > 0) {
        pkgs.push({
          id: `pkg-preset-${idx}-3`,
          description: 'Fortune Sunflower Oil (15L)',
          quantity: qTins,
          unitType: 'tins',
        });
      }

      const synced = syncStopCargo(pkgs);

      return {
        shopkeeperCode: shop.code,
        shopName: shop.shopName,
        shopkeeperName: shop.ownerName,
        shopkeeperPhone: shop.phone,
        address: shop.address,
        locality: shop.locality,
        lat: shop.lat,
        lng: shop.lng,
        cargoPackages: pkgs,
        itemsDescription: synced.itemsDescription,
        quantity: synced.quantity,
        unitType: synced.unitType,
        notes: `Stop #${idx + 1} priority drop`,
        placeLabel: getPlaceLabel(idx + 1),
      };
    });

    setStops(newStops);
    setPaymentOffered(Math.max(800, count * 75 + 300));
    setGoodsValue(count * 5500);
  };

  // Bulk paste codes
  const handleBulkAddCodes = () => {
    if (!bulkCodesText.trim()) return;
    const codes = bulkCodesText
      .split(/[\n,; ]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0);

    const newStops: StopDraft[] = [...stops];
    for (const code of codes) {
      if (newStops.length >= 40) break;
      const found = lookupShopkeeperByCode(code);
      const nextIdx = newStops.length + 1;

      const initialPkgs: CargoPackageDraft[] = [
        {
          id: `pkg-bulk-${nextIdx}-1`,
          description: found ? (found.typicalItems?.split(',')[0] || 'Carton FMCG packs') : 'Standard FMCG cartons',
          quantity: 6,
          unitType: 'cartons',
        },
        {
          id: `pkg-bulk-${nextIdx}-2`,
          description: 'Commodity Bags (Atta/Rice/Dals)',
          quantity: 4,
          unitType: 'bags',
        },
      ];
      const synced = syncStopCargo(initialPkgs);

      if (found) {
        newStops.push({
          shopkeeperCode: found.code,
          shopName: found.shopName,
          shopkeeperName: found.ownerName,
          shopkeeperPhone: found.phone,
          address: found.address,
          locality: found.locality,
          lat: found.lat,
          lng: found.lng,
          cargoPackages: initialPkgs,
          itemsDescription: synced.itemsDescription,
          quantity: synced.quantity,
          unitType: synced.unitType,
          notes: '',
          placeLabel: getPlaceLabel(nextIdx),
        });
      } else {
        newStops.push({
          shopkeeperCode: code,
          shopName: `Kirana Store (${code})`,
          shopkeeperName: 'Shop Owner',
          shopkeeperPhone: '+91 98000 00000',
          address: 'Market Yard, Hyderabad',
          locality: 'Hyderabad',
          lat: 17.3850 + (Math.random() - 0.5) * 0.06,
          lng: 78.4867 + (Math.random() - 0.5) * 0.06,
          cargoPackages: initialPkgs,
          itemsDescription: synced.itemsDescription,
          quantity: synced.quantity,
          unitType: synced.unitType,
          notes: '',
          placeLabel: getPlaceLabel(nextIdx),
        });
      }
    }

    setStops(newStops);
    setBulkCodesText('');
    setShowBulkModal(false);
  };

  // Apply Route Optimization (Rearrange stops in shortest path sequence)
  const handleApplyOptimization = () => {
    const { optimizedStops } = optimizationResult;
    const reordered: StopDraft[] = optimizedStops.map((s, idx) => {
      const original = stops.find((orig) => orig.shopkeeperCode === s.shopkeeperCode) || stops[idx];
      return {
        ...original,
        placeLabel: s.placeLabel || getPlaceLabel(idx + 1),
      };
    });
    setStops(reordered);
  };

  const handleRemoveStop = (idx: number) => {
    if (stops.length <= 1) return;
    const updated = stops.filter((_, i) => i !== idx).map((s, i) => ({
      ...s,
      placeLabel: getPlaceLabel(i + 1),
    }));
    setStops(updated);
  };

  const handleStartEditTrip = (trip: Trip) => {
    setEditingTripId(trip.id);
    setPickupAddress(trip.pickupAddress);
    setPickupLat(trip.pickupLat);
    setPickupLng(trip.pickupLng);
    setGoodsValue(trip.goodsValue);
    setPaymentOffered(trip.paymentOffered);
    setStops(
      trip.stops.map((s, idx) => {
        const pkgs: CargoPackageDraft[] =
          s.cargoPackages && s.cargoPackages.length > 0
            ? s.cargoPackages.map((p) => ({
                id: p.id,
                description: p.description,
                quantity: p.quantity,
                unitType: (p.unitType === 'boxes' ? 'tins' : p.unitType) as 'cartons' | 'bags' | 'tins',
              }))
            : [
                {
                  id: `pkg-edit-${s.id}-1`,
                  description: s.itemsDescription || `${s.quantity} items`,
                  quantity: s.quantity || 10,
                  unitType: (s.unitType === 'boxes' ? 'tins' : s.unitType) as 'cartons' | 'bags' | 'tins',
                },
              ];

        return {
          shopkeeperCode: s.shopkeeperCode,
          shopName: s.shopName,
          shopkeeperName: s.shopkeeperName,
          shopkeeperPhone: s.shopkeeperPhone,
          address: s.address,
          locality: s.address.split(',')[0],
          lat: s.lat,
          lng: s.lng,
          cargoPackages: pkgs,
          itemsDescription: s.itemsDescription || '',
          quantity: s.quantity,
          unitType: s.unitType === 'boxes' ? 'tins' : s.unitType,
          notes: s.notes || '',
          placeLabel: s.placeLabel || getPlaceLabel(idx + 1),
        };
      })
    );
    handleOpenTripBuilder();
  };

  const handleCancelEdit = () => {
    setEditingTripId(null);
    setStops([
      {
        shopkeeperCode: 'SHP-101',
        shopName: 'Sri Balaji Kirana & Provisions',
        shopkeeperName: 'Venkat Reddy',
        shopkeeperPhone: '+91 94401 67890',
        address: 'Shop #3, Koti Main Road, Opposite Andhra Bank',
        locality: 'Koti',
        lat: 17.3850,
        lng: 78.4867,
        cargoPackages: [
          { id: 'pkg-101-1', description: 'Parle-G Glucose Biscuits', quantity: 15, unitType: 'cartons' },
          { id: 'pkg-101-2', description: 'Britannia Good Day Butter Cookies', quantity: 10, unitType: 'cartons' },
        ],
        itemsDescription: '15 cartons of Parle-G • 10 cartons of Britannia Good Day',
        quantity: 25,
        unitType: 'cartons',
        notes: 'Deliver before 12 PM',
        placeLabel: 'Place B',
      },
      {
        shopkeeperCode: 'SHP-102',
        shopName: 'Lakshmi Super Mart & General Store',
        shopkeeperName: 'Lakshmi Narayana',
        shopkeeperPhone: '+91 98492 33445',
        address: 'Plot 12, Sultan Bazar X Roads',
        locality: 'Sultan Bazar',
        lat: 17.3915,
        lng: 78.4890,
        cargoPackages: [
          { id: 'pkg-102-1', description: 'Tata Tea Gold Leaf', quantity: 12, unitType: 'bags' },
          { id: 'pkg-102-2', description: 'Surf Excel Easy Wash Detergent', quantity: 8, unitType: 'cartons' },
        ],
        itemsDescription: '12 bags of Tata Tea Gold • 8 cartons of Surf Excel',
        quantity: 20,
        unitType: 'bags',
        notes: 'Call 10 mins before reaching',
        placeLabel: 'Place C',
      },
      {
        shopkeeperCode: 'SHP-103',
        shopName: 'Mahalaxmi Provision Store',
        shopkeeperName: 'Murali Mohan',
        shopkeeperPhone: '+91 97001 55667',
        address: 'Station Road, Beside Metro Pillar 18',
        locality: 'Kachiguda',
        lat: 17.3980,
        lng: 78.4975,
        cargoPackages: [
          { id: 'pkg-103-1', description: 'Aashirvaad Sharbati Atta', quantity: 10, unitType: 'bags' },
          { id: 'pkg-103-2', description: 'Fortune Refined Sunflower Oil (15L)', quantity: 5, unitType: 'tins' },
        ],
        itemsDescription: '10 bags of Aashirvaad Atta • 5 tins of Fortune Sunflower Oil',
        quantity: 15,
        unitType: 'tins',
        notes: 'Hand over invoice copy',
        placeLabel: 'Place D',
      },
    ]);
  };

  const handleConfirmDeleteTrip = () => {
    if (!tripToDelete) return;
    const deletedId = tripToDelete.id;
    deleteTrip(deletedId);
    setTripToDelete(null);
    if (selectedTripId === deletedId) {
      const remaining = trips.filter((t) => t.id !== deletedId);
      setSelectedTripId(remaining[0]?.id || '');
    }
  };

  const handleCreateTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stops.length === 0) {
      alert('Please add at least 1 shopkeeper unique code.');
      return;
    }

    const { routePlan, optimizedStops } = optimizationResult;

    const formattedStops = stops.map((s, idx) => ({
      id: `stop-${editingTripId || 'draft'}-${idx + 1}`,
      tripId: editingTripId || '',
      sequenceNumber: idx + 1,
      placeLabel: s.placeLabel || getPlaceLabel(idx + 1),
      shopkeeperCode: s.shopkeeperCode,
      shopName: s.shopName,
      shopkeeperName: s.shopkeeperName,
      shopkeeperPhone: s.shopkeeperPhone,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      cargoPackages: s.cargoPackages,
      itemsDescription: s.itemsDescription,
      quantity: Number(s.quantity) || 1,
      unitType: s.unitType,
      notes: s.notes,
      status: 'pending' as const,
      deliveryOtp: String(Math.floor(100000 + Math.random() * 900000)),
    }));

    if (editingTripId) {
      updateTrip(editingTripId, {
        pickupAddress,
        pickupLat,
        pickupLng,
        goodsDescription: compositeGoodsDescription,
        totalQuantity: totalCargoQuantity,
        goodsValue: Number(goodsValue),
        paymentOffered: Number(paymentOffered),
        totalStops: stops.length,
        estimatedDistanceKm: routePlan.totalDistanceKm,
        estimatedDurationMin: routePlan.totalDurationMin,
        routePlan,
        stops: formattedStops,
      });
      setSelectedTripId(editingTripId);
      setEditingTripId(null);
    } else {
      createTrip({
        pickupAddress,
        pickupLat,
        pickupLng,
        goodsDescription: compositeGoodsDescription,
        totalQuantity: totalCargoQuantity,
        goodsValue: Number(goodsValue),
        paymentOffered: Number(paymentOffered),
        totalStops: stops.length,
        estimatedDistanceKm: routePlan.totalDistanceKm,
        estimatedDurationMin: routePlan.totalDurationMin,
        routePlan,
        stops: formattedStops,
      });
    }

    setActiveTab('trips');
  };

  const myTrips = trips.filter((t) => t.distributorId === currentUser.id || true);
  const statusCounts = useMemo(() => ({
    all: myTrips.length,
    in_progress: myTrips.filter((t) => t.status === 'in_progress').length,
    published: myTrips.filter((t) => t.status === 'published').length,
    assigned: myTrips.filter((t) => t.status === 'assigned').length,
    completed: myTrips.filter((t) => t.status === 'completed').length,
  }), [myTrips]);

  const filteredTrips = useMemo(() => {
    if (statusFilter === 'all') return myTrips;
    return myTrips.filter((t) => t.status === statusFilter);
  }, [myTrips, statusFilter]);

  const liveTrips = useMemo(() => {
    return myTrips.filter((t) => t.status === 'in_progress' || t.status === 'assigned' || t.status === 'published');
  }, [myTrips]);

  const selectedTrip = useMemo(() => {
    if (selectedTripId) {
      const found = trips.find((t) => t.id === selectedTripId);
      if (found) return found;
    }
    // Fallback: active in_progress or assigned first, else first trip
    const active = trips.find((t) => t.status === 'in_progress' || t.status === 'assigned');
    return active || trips[0];
  }, [trips, selectedTripId]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Mobile-First Header & Distributor Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {currentUser.businessName || currentUser.fullName}
              </h1>
              <span className="font-mono text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                {currentUser.userCode || 'DST-4401'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Wholesale FMCG Multi-Stop Delivery Hub
            </p>
          </div>

          <button
            id="create-trip-btn"
            onClick={handleOpenTripBuilder}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Delivery Trip</span>
            <span className="xs:hidden">New Trip</span>
          </button>
        </div>

        {/* Mobile Quick Status Metric Bar */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              setActiveTab('live');
              const active = trips.find((t) => t.status === 'in_progress' || t.status === 'assigned');
              if (active) setSelectedTripId(active.id);
            }}
            className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 hover:bg-amber-100/60 transition text-left cursor-pointer"
          >
            <span className="text-[10px] font-semibold text-amber-800 block truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Live
            </span>
            <span className="text-base font-bold text-amber-900">{statusCounts.in_progress}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trips');
              setStatusFilter('published');
            }}
            className="p-2 rounded-xl bg-blue-50/60 border border-blue-200/60 hover:bg-blue-100/60 transition text-left cursor-pointer"
          >
            <span className="text-[10px] font-semibold text-blue-800 block truncate">Open Bids</span>
            <span className="text-base font-bold text-blue-900">{statusCounts.published}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trips');
              setStatusFilter('completed');
            }}
            className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/60 hover:bg-emerald-100/60 transition text-left cursor-pointer"
          >
            <span className="text-[10px] font-semibold text-emerald-800 block truncate">Done</span>
            <span className="text-base font-bold text-emerald-900">{statusCounts.completed}</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition text-left cursor-pointer"
          >
            <span className="text-[10px] font-semibold text-slate-600 block truncate">Orders</span>
            <span className="text-base font-bold text-slate-800">
              {orders.filter((o) => o.status === 'pending').length}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Mobile Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 sticky top-16 z-30 backdrop-blur-md shadow-2xs">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
            activeTab === 'live'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <div className="relative">
            <Navigation className={`w-4 h-4 ${activeTab === 'live' ? 'text-amber-600' : 'text-slate-500'}`} />
            {statusCounts.in_progress > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <span className="truncate">Live Trip</span>
          {statusCounts.in_progress > 0 && (
            <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
              {statusCounts.in_progress}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
            activeTab === 'trips'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Truck className={`w-4 h-4 ${activeTab === 'trips' ? 'text-blue-600' : 'text-slate-500'}`} />
          <span className="truncate">Trips</span>
          <span className="text-[10px] font-semibold text-slate-500 ml-0.5">({myTrips.length})</span>
        </button>

        <button
          id="tab-trip-builder-btn"
          onClick={handleOpenTripBuilder}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
            activeTab === 'create'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Plus className={`w-4 h-4 ${activeTab === 'create' ? 'text-blue-600' : 'text-slate-500'}`} />
          <span className="truncate">{editingTripId ? 'Edit' : 'New Trip'}</span>
          <span className="text-[10px] font-bold px-1 rounded bg-blue-100 text-blue-700 ml-0.5">
            {stops.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Store className={`w-4 h-4 ${activeTab === 'orders' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="truncate">Orders</span>
          {orders.filter((o) => o.status === 'pending').length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white ml-0.5">
              {orders.filter((o) => o.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DEDICATED SEPARATE LIVE TRIP TRACKING SECTION                */}
      {/* ========================================================================= */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Trip Switcher Selector (Horizontal scroll for mobile) */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Select Live Trip to Monitor:
              </span>
              <span className="text-[11px] text-slate-400">
                {myTrips.length} Total Trips
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
              {myTrips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const isLive = trip.status === 'in_progress';
                return (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    {isLive && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                    <span>{trip.id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : trip.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : trip.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {trip.status.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTrip ? (
            <div className="space-y-4">
              {/* Live Cockpit Header Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
                {/* Trip ID, Status & Payout */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {selectedTrip.id}
                      </h2>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          selectedTrip.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : selectedTrip.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : selectedTrip.status === 'assigned'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {selectedTrip.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Godown (Place A): {selectedTrip.pickupAddress}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">Captain Payout</span>
                    <span className="text-base font-bold text-slate-900">₹{selectedTrip.paymentOffered}</span>
                  </div>
                </div>

                {/* Captain / Driver Card */}
                {selectedTrip.driverName ? (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                        🛺
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          Captain {selectedTrip.driverName}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          Auto: <span className="font-mono font-semibold">{selectedTrip.driverVehicleNumber || 'TS 09 UA 4521'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {selectedTrip.driverPhone && (
                        <a
                          href={`tel:${selectedTrip.driverPhone}`}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Call Captain</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Broadcasting to local Captions. Bids are open.</span>
                    </div>
                  </div>
                )}

                {/* Progress Bar (X / Y delivered) */}
                {(() => {
                  const deliveredCount = selectedTrip.stops.filter((s) => s.status === 'delivered').length;
                  const percent = Math.round((deliveredCount / selectedTrip.stops.length) * 100) || 0;
                  return (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Delivery Progress: {deliveredCount} of {selectedTrip.stops.length} Shops Completed</span>
                        </span>
                        <span className="font-mono text-emerald-700 font-bold">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Live Stats Chips */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Total Shops</span>
                    <span className="font-bold text-slate-800">{selectedTrip.totalStops} Shops</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Est. Distance</span>
                    <span className="font-bold text-slate-800">{selectedTrip.estimatedDistanceKm} km</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Goods Value</span>
                    <span className="font-bold text-emerald-700">₹{selectedTrip.goodsValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Visual Delivery Path & Auto Driver Position Tracker (No maps) */}
              <AutoDriverPathTracker
                trip={selectedTrip}
                onViewProof={(stop) => setViewingProofStop(stop)}
              />

              {/* Proof of Delivery (e-PoD) Section */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Signed Bills & Challans (e-PoD)</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedTrip.stops.filter((s) => Boolean(s.signedBillPhotoUrl)).length} / {selectedTrip.stops.length} Uploaded
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTrip.stops.map((stop) => {
                    const hasSignedBill = Boolean(stop.signedBillPhotoUrl);
                    return (
                      <div
                        key={stop.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          hasSignedBill ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {hasSignedBill ? (
                            <div
                              onClick={() => setViewingProofStop(stop)}
                              className="w-12 h-14 rounded-lg overflow-hidden border border-emerald-300 bg-slate-900 shrink-0 cursor-pointer shadow-xs"
                            >
                              <img
                                src={stop.signedBillPhotoUrl}
                                alt={stop.shopName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center text-slate-400 shrink-0">
                              <Camera className="w-4 h-4 opacity-50" />
                              <span className="text-[8px] font-bold uppercase mt-0.5">Pending</span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 truncate block">
                              {stop.shopName}
                            </span>
                            <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-100 inline-block mt-0.5">
                              {stop.shopkeeperCode}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                              {hasSignedBill ? '✓ Signed Challan Uploaded' : 'Awaiting counter delivery'}
                            </span>
                          </div>
                        </div>

                        {hasSignedBill && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewingProofStop(stop)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold text-center"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                downloadPhotograph(
                                  stop.signedBillPhotoUrl!,
                                  stop.signedBillFileName || `Signed_Bill_${stop.shopkeeperCode}_${selectedTrip.id}.png`
                                )
                              }
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold text-center"
                            >
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
              <Package className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-800">No Trip Selected for Live Tracking</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select any delivery trip from the list above or switch to Delivery Trips tab to track.
              </p>
              <button
                onClick={() => setActiveTab('trips')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Go to Delivery Trips
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DELIVERY TRIPS WITH TOGGLEABLE STATUS SECTIONS                */}
      {/* ========================================================================= */}
      {activeTab === 'trips' && (
        <div className="space-y-4">
          {/* Segmented Status Toggle Bar (All, In Progress, Published, Assigned, Completed) */}
          <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 px-2 py-1 flex items-center justify-between">
              <span>Filter Trips by Status Toggle:</span>
              <span className="font-bold text-slate-700">{filteredTrips.length} Trips Listed</span>
            </div>

            {/* Tactile Mobile Toggle Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
              {(
                [
                  { id: 'all', label: 'All Trips', count: statusCounts.all },
                  { id: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
                  { id: 'published', label: 'Published', count: statusCounts.published },
                  { id: 'assigned', label: 'Assigned', count: statusCounts.assigned },
                  { id: 'completed', label: 'Completed', count: statusCounts.completed },
                ] as const
              ).map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 min-h-[42px] cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    {tab.id === 'in_progress' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Trips (Designed strictly for mobile view) */}
          <div className="space-y-3">
            {filteredTrips.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-800">
                  No {statusFilter.replace('_', ' ')} Trips
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No delivery routes found under this filter. Tap 'All Trips' or create a new multi-stop route.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    View All Trips
                  </button>
                  <button
                    onClick={handleOpenTripBuilder}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    + Create New Trip
                  </button>
                </div>
              </div>
            ) : (
              filteredTrips.map((trip) => {
                const deliveredStops = trip.stops.filter((s) => s.status === 'delivered').length;
                const isSelectedForLive = selectedTrip?.id === trip.id;
                const isExpanded = expandedTripStopsId === trip.id;

                // Total cargo calculation for badges
                let cartonsTotal = 0;
                let bagsTotal = 0;
                let tinsTotal = 0;
                trip.stops.forEach((s) => {
                  if (s.cargoPackages && s.cargoPackages.length > 0) {
                    s.cargoPackages.forEach((p) => {
                      if (p.unitType === 'cartons') cartonsTotal += p.quantity;
                      else if (p.unitType === 'bags') bagsTotal += p.quantity;
                      else tinsTotal += p.quantity;
                    });
                  } else {
                    if (s.unitType === 'bags') bagsTotal += s.quantity;
                    else if (s.unitType === 'tins') tinsTotal += s.quantity;
                    else cartonsTotal += s.quantity;
                  }
                });

                return (
                  <div
                    key={trip.id}
                    id={`trip-card-${trip.id}`}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3 transition-all hover:border-slate-300"
                  >
                    {/* Top Row: Trip ID, Status, Payment */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{trip.id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              trip.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : trip.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : trip.status === 'assigned'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {trip.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">From: {trip.pickupAddress.split(',')[0]} ➔ {trip.totalStops} Shops</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-slate-900">₹{trip.paymentOffered}</span>
                        <span className="block text-[10px] text-slate-400">Driver Pay</span>
                      </div>
                    </div>

                    {/* Middle Row: Cargo Units Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Cargo:</span>
                      {cartonsTotal > 0 && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                          {cartonsTotal} Cartons
                        </span>
                      )}
                      {bagsTotal > 0 && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {bagsTotal} Bags
                        </span>
                      )}
                      {tinsTotal > 0 && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                          {tinsTotal} Tins
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium ml-auto">
                        Value: ₹{trip.goodsValue.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress Bar & Driver Info */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{deliveredStops}/{trip.totalStops} Shops Delivered</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trip.estimatedDistanceKm} km</span>
                        </div>
                      </div>

                      {/* Micro progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round((deliveredStops / trip.totalStops) * 100)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        {trip.driverName ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                            <span className="text-amber-500 text-sm">🛺</span>
                            <span className="truncate">Captain: {trip.driverName}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ({trip.driverVehicleNumber || 'TS 09 UA 4521'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Published in Marketplace • Bids Open
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mobile Action Buttons Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Live Tracking Trigger */}
                        <button
                          type="button"
                          onClick={() => handleTrackTripLive(trip.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition min-h-[40px] cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Track Live</span>
                        </button>

                        {/* View/Hide Stops Accordion */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTripStopsId(isExpanded ? null : trip.id)
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition min-h-[40px] cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Shops' : `Shops (${trip.totalStops})`}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Quick Edit/Delete for published trips */}
                      {trip.status === 'published' && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleStartEditTrip(trip)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2.5 py-2 rounded-xl font-bold text-xs transition min-h-[40px] cursor-pointer"
                            title="Edit trip details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTripToDelete(trip)}
                            className="inline-flex items-center gap-1 text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl font-bold text-xs transition min-h-[40px] cursor-pointer"
                            title="Delete published trip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expandable Stops Drawer */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-dashed border-slate-200 space-y-2 animate-in fade-in duration-150">
                        <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                          <span>Delivery Route Itinerary ({trip.stops.length} Shops):</span>
                          <span className="text-slate-400 font-normal">Click Track Live for GPS</span>
                        </div>

                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {trip.stops.map((stop, sIdx) => (
                            <div
                              key={stop.id}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between text-xs gap-2"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="font-bold text-slate-900 truncate">
                                      {stop.shopName}
                                    </span>
                                    <span className="font-mono text-[10px] text-blue-600 font-bold">
                                      {stop.shopkeeperCode}
                                    </span>
                                  </div>
                                  <div className="text-slate-500 text-[11px] truncate">
                                    {stop.address}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                                    stop.status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {stop.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRIP BUILDER (1-40 SHOPS UNIQUE CODE & GOOGLE MAPS ROUTE) */}
      {activeTab === 'create' && (
        <form
          id="trip-builder-form"
          ref={tripBuilderRef}
          onSubmit={handleCreateTripSubmit}
          className="space-y-6 max-w-5xl mx-auto scroll-mt-6"
        >
          {/* Main Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{editingTripId ? `Edit Delivery Trip: ${editingTripId}` : 'Create Delivery Trip'}</span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      editingTripId
                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {editingTripId ? 'Editing Mode' : 'Up to 40 Shops'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingTripId
                    ? 'Modify shopkeeper codes, goods details, or driver payout. Changes will sync immediately across all drivers and shopkeepers.'
                    : 'Enter only the unique code of each shopkeeper and cargo to send. Google Maps calculates the minimum-distance personalized plan.'}
                </p>
              </div>

              {/* Counter Badge & Cancel Edit */}
              <div className="flex items-center gap-2">
                {editingTripId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel Edit</span>
                  </button>
                )}
                <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-right">
                  <span className="text-[10px] text-blue-600 font-semibold block uppercase">Shops Count</span>
                  <span className="font-bold text-blue-900 text-base">{stops.length} / 40 Added</span>
                </div>
              </div>
            </div>

            {/* Edit Mode Alert Banner */}
            {editingTripId && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Editing Live Published Trip: {editingTripId}</span>
                    <span className="text-amber-700 text-[11px]">
                      Any changes to shop stops, cargo items, or driver payout will update in real-time across the driver marketplace and kirana shopkeeper views upon saving.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const trip = trips.find((t) => t.id === editingTripId);
                      if (trip) setTripToDelete(trip);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Trip</span>
                  </button>
                </div>
              </div>
            )}

            {/* Warehouse (Place A) & Financials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Place A: Pickup Godown
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Begum Bazar FMCG Hub</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Goods Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={goodsValue}
                  onChange={(e) => setGoodsValue(Number(e.target.value))}
                  required
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Insurance & transit liability</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Payment Offered (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  value={paymentOffered}
                  onChange={(e) => setPaymentOffered(Number(e.target.value))}
                  required
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                  Guaranteed payout to auto driver
                </span>
              </div>
            </div>

            {/* Quick Preset Buttons & Bulk Tool */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Quick Presets:
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadPresetBatch(5)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 transition"
                >
                  ⚡ 5 Shops
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetBatch(10)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 transition"
                >
                  ⚡ 10 Shops
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetBatch(20)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 transition"
                >
                  ⚡ 20 Shops
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetBatch(40)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition"
                >
                  ⚡ Full 40 Shops Load
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition"
                >
                  <ListPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bulk Paste Codes</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyOptimization}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize Shortest Route</span>
                </button>
              </div>
            </div>

            {/* Quick Add Stop Input Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  + Add Stop By Shopkeeper Unique Code (e.g. SHP-101 to SHP-145)
                </label>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Search by code, shop name, owner, or locality
                </span>
              </div>

              {stopAddedNotification && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Successfully added <strong>{stopAddedNotification.name}</strong> as <strong>Stop #{stopAddedNotification.stopNum}</strong> in the list below.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStopAddedNotification(null)}
                    className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <div ref={dropdownContainerRef} className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Type Shop Unique Code (e.g. SHP-104) or search store name / locality..."
                    value={codeInput}
                    onFocus={() => setIsDropdownOpen(true)}
                    onClick={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setCodeInput(e.target.value);
                      setCodeSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsDropdownOpen(false);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (codeInput.trim()) {
                          const matched = searchShopkeepers(codeInput);
                          if (matched.length > 0) {
                            handleAddStopByCode(matched[0].code);
                          } else {
                            handleAddStopByCode(codeInput);
                          }
                        }
                      }
                    }}
                    className="w-full pl-9 pr-16 py-2 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-2xs"
                  />

                  {/* Input right actions: clear query & toggle dropdown */}
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {codeInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setCodeInput('');
                          setCodeSearchQuery('');
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                        title="Clear input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                      title={isDropdownOpen ? 'Close shop list' : 'Browse registered stores'}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Autocomplete Suggestions Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-64 overflow-y-auto z-40 p-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 bg-slate-50/80 rounded-lg mb-1 text-[11px]">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-blue-600" />
                          {codeSearchQuery.trim()
                            ? `Matching Stores for "${codeSearchQuery}"`
                            : 'Select a Registered Kirana Store'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                          title="Close list"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {searchShopkeepers(codeSearchQuery).length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          <p>No registered shops match "{codeSearchQuery}".</p>
                          <button
                            type="button"
                            onClick={() => handleAddStopByCode(codeSearchQuery)}
                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 underline block mx-auto cursor-pointer"
                          >
                            + Add custom store with code "{codeSearchQuery.toUpperCase()}"
                          </button>
                        </div>
                      ) : (
                        searchShopkeepers(codeSearchQuery).map((s) => {
                          const isAlreadyAdded = stops.some((st) => st.shopkeeperCode === s.code);
                          const existingIndex = stops.findIndex((st) => st.shopkeeperCode === s.code);

                          return (
                            <div
                              key={s.code}
                              onClick={() => {
                                handleAddStopByCode(s.code);
                              }}
                              className="p-2.5 hover:bg-blue-50 active:bg-blue-100 rounded-lg cursor-pointer flex items-center justify-between text-xs transition border border-transparent hover:border-blue-100 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                                  {s.code}
                                </span>
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 group-hover:text-blue-700 truncate">
                                      {s.shopName}
                                    </span>
                                    {isAlreadyAdded && (
                                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                                        ✓ In Trip (Stop #{existingIndex + 1})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px] truncate flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{s.address} ({s.locality})</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 ml-3">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2 py-1 rounded transition">
                                  + Select Shop
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  id="add-stop-submit-btn"
                  onClick={() => {
                    if (codeInput.trim()) {
                      handleAddStopByCode(codeInput);
                    } else if (isDropdownOpen) {
                      setIsDropdownOpen(false);
                      setCodeSearchQuery('');
                    } else {
                      setIsDropdownOpen(true);
                    }
                  }}
                  disabled={stops.length >= 40}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stop</span>
                </button>
              </div>
            </div>

            {/* List of Stops (Up to 40) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Stops Itinerary ({stops.length}/40) • Review unique codes & cargo
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Cargo: <strong>{totalCargoQuantity} units</strong>
                </span>
              </div>

              <div
                ref={stopsListContainerRef}
                className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scroll-smooth"
              >
                {stops.map((stop, idx) => {
                  const placeLetter = stop.placeLabel?.replace('Place ', '') || String.fromCharCode(66 + idx);
                  const isNewlyAdded = justAddedShopCode === stop.shopkeeperCode && idx === stops.length - 1;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border shadow-xs space-y-3 transition-all duration-300 ${
                        isNewlyAdded
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Row 1: Header with Place Label, Unique Code, and Remove Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                            {placeLetter}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Stop #{idx + 1} • Place {placeLetter}
                          </span>
                          {/* Unique Code input */}
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 font-medium">Code:</span>
                            <input
                              type="text"
                              value={stop.shopkeeperCode}
                              onChange={(e) => handleUpdateStopCode(idx, e.target.value)}
                              className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 uppercase w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="SHP-101"
                            />
                          </div>
                        </div>

                        {/* Remove Action */}
                        <div className="flex items-center gap-2">
                          {stops.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStop(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 text-xs transition"
                              title="Remove Stop"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Resolved Shop Details (Auto-populated from unique code) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Shop & Owner:</span>
                          <span className="font-semibold text-slate-900">{stop.shopName}</span>
                          <span className="text-slate-500 text-[11px] ml-1.5">({stop.shopkeeperName})</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Address & Locality:</span>
                          <span className="text-slate-700 truncate block">{stop.address}</span>
                        </div>
                      </div>

                      {/* Row 3: Multi-Item Goods Breakdown (Multiple Bags, Cartons, Tins for the Same Shop) */}
                      <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800">
                              Goods & Cargo for {stop.shopName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                              (Add multiple items: Bags, Cartons, Tins)
                            </span>
                          </div>

                          {/* Quick Package Adder Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Add:</span>
                            <button
                              type="button"
                              onClick={() => handleAddPackageToStop(idx, 'cartons')}
                              className="text-[10px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Add Cartons line item"
                            >
                              <Plus className="w-3 h-3 text-blue-600" />
                              <span>Cartons</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddPackageToStop(idx, 'bags')}
                              className="text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Add Bags line item"
                            >
                              <Plus className="w-3 h-3 text-emerald-600" />
                              <span>Bags</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddPackageToStop(idx, 'tins')}
                              className="text-[10px] font-bold bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 hover:border-amber-400 px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Add Tins line item"
                            >
                              <Plus className="w-3 h-3 text-amber-600" />
                              <span>Tins</span>
                            </button>
                          </div>
                        </div>

                        {/* List of Cargo Package Rows for this Shop */}
                        <div className="space-y-2">
                          {(stop.cargoPackages && stop.cargoPackages.length > 0
                            ? stop.cargoPackages
                            : [
                                {
                                  id: `pkg-${idx}-1`,
                                  description: stop.itemsDescription || 'Assorted FMCG goods',
                                  quantity: stop.quantity || 10,
                                  unitType: (stop.unitType === 'boxes' ? 'tins' : stop.unitType) as 'cartons' | 'bags' | 'tins',
                                },
                              ]
                          ).map((pkg, pkgIdx, arr) => (
                            <div
                              key={pkg.id || pkgIdx}
                              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                            >
                              {/* Item description */}
                              <div className="sm:col-span-7">
                                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                                  Item #{pkgIdx + 1} Description (Goods to send):
                                </label>
                                <input
                                  type="text"
                                  placeholder={
                                    pkg.unitType === 'cartons'
                                      ? 'e.g. Parle-G 15 cartons, Britannia Good Day 10 cartons'
                                      : pkg.unitType === 'bags'
                                      ? 'e.g. Aashirvaad Atta 10 bags, Tata Salt 5 bags, Rice'
                                      : 'e.g. Fortune Refined Sunflower Oil 15L, Pure Ghee 15kg'
                                  }
                                  value={pkg.description}
                                  onChange={(e) =>
                                    handleUpdatePackage(idx, pkgIdx, { description: e.target.value })
                                  }
                                  required
                                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50/60 hover:bg-white focus:bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              {/* Quantity */}
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                                  Quantity:
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={pkg.quantity}
                                  onChange={(e) =>
                                    handleUpdatePackage(idx, pkgIdx, {
                                      quantity: Math.max(1, Number(e.target.value) || 1),
                                    })
                                  }
                                  required
                                  className="w-full text-xs px-2.5 py-1.5 font-bold text-slate-900 bg-slate-50/60 hover:bg-white focus:bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                                />
                              </div>

                              {/* Unit Dropdown: Cartons, Bags, Tins */}
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                                  Unit Type:
                                </label>
                                <select
                                  value={pkg.unitType === 'boxes' ? 'tins' : pkg.unitType}
                                  onChange={(e) =>
                                    handleUpdatePackage(idx, pkgIdx, {
                                      unitType: e.target.value as 'cartons' | 'bags' | 'tins',
                                    })
                                  }
                                  className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                                >
                                  <option value="cartons">Cartons</option>
                                  <option value="bags">Bags</option>
                                  <option value="tins">Tins</option>
                                </select>
                              </div>

                              {/* Action: Delete package row if arr.length > 1 */}
                              <div className="sm:col-span-1 flex items-end justify-center pt-2 sm:pt-4">
                                {arr.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePackage(idx, pkgIdx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                    title="Remove this item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-mono">1/1</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer with "+ Add Another Item" button and live total summary for this shop */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                          <button
                            type="button"
                            onClick={() => handleAddPackageToStop(idx, 'bags')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-blue-600" />
                            <span>+ Add More Goods (Bags / Cartons / Tins) to this Shop</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              Shop Total: <span className="text-blue-700">{stop.quantity} items</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({stop.cargoPackages?.map((p) => `${p.quantity} ${p.unitType}`).join(' + ') || `${stop.quantity} ${stop.unitType}`})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Planned Delivery Path Sequence Preview (No maps - maps are for auto drivers only) */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="text-base">🛺</span>
                  <span>Planned Delivery Path Sequence ({stops.length} Shops)</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {optimizationResult.routePlan.totalDistanceKm} km • ~{optimizationResult.routePlan.totalDurationMin} mins
                </span>
              </div>

              {/* Path stations visual ribbon */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                    A
                  </span>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-white block">Place A</span>
                    <span className="text-[9px] text-slate-400 block max-w-[120px] truncate">Godown Pickup</span>
                  </div>
                </div>

                {stops.map((stop, sIdx) => {
                  const placeLetter = String.fromCharCode(66 + sIdx);
                  return (
                    <React.Fragment key={sIdx}>
                      <span className="text-slate-600 font-bold shrink-0">➔</span>
                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center">
                          {placeLetter}
                        </span>
                        <div className="text-left">
                          <span className="text-[11px] font-bold text-white block">Place {placeLetter}</span>
                          <span className="text-[9px] text-slate-400 block max-w-[110px] truncate">{stop.shopName}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Rapido-style optimized shortest driving path. Map navigation and turn-by-turn routing will be provided to the assigned Captain upon trip acceptance.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span>Trip covers <strong>{stops.length} shops</strong> • </span>
                <span>Est. Driving: <strong>{optimizationResult.routePlan.totalDistanceKm} km</strong> • </span>
                <span>Payment Offered: <strong className="text-slate-900">₹{paymentOffered}</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('trips')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="publish-trip-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {editingTripId ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Update Trip Details ({editingTripId})</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish Trip for Captions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Paste Codes Modal */}
          {showBulkModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ListPlus className="w-5 h-5 text-blue-600" />
                    Bulk Add Shopkeeper Unique Codes
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Paste comma, space, or newline separated shopkeeper unique codes (e.g. <code>SHP-101, SHP-105, SHP-112, SHP-120</code>).
                </p>
                <textarea
                  rows={5}
                  value={bulkCodesText}
                  onChange={(e) => setBulkCodesText(e.target.value)}
                  placeholder="SHP-101, SHP-102, SHP-105, SHP-108, SHP-112, SHP-115, SHP-120, SHP-125..."
                  className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Available codes in catalog: SHP-101 to SHP-145 (45 registered shops)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkAddCodes}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
                    >
                      Add to Trip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: RETAIL ORDERS INBOX */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Retail Store Purchase Requests</h2>
              <p className="text-xs text-slate-500">Incoming stock replenishment requests sent directly by shopkeepers</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {orders.length} Total Requests
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{order.shopName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.urgency === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : order.urgency === 'same_day'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {order.urgency}
                    </span>
                    <span className="text-xs text-slate-400">• {order.contactNumber}</span>
                  </div>
                  <p className="text-xs text-slate-600">{order.itemsDescription}</p>
                  <p className="text-[11px] text-slate-400">Qty: {order.quantity} {order.unitType} • {order.address}</p>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'accepted')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                      >
                        Accept & Queue
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'declined')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {order.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Published Trip Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Published Trip?</h3>
                <p className="font-mono text-xs font-semibold text-rose-700">{tripToDelete.id}</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs text-rose-800">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Permanent Global Removal Notice:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-rose-700 text-[11px] pl-1">
                <li>
                  <strong>Captions:</strong> Vanishes immediately from the marketplace & route bidding.
                </li>
                <li>
                  <strong>Kirana Shopkeepers ({tripToDelete.totalStops} shops):</strong> Inbound delivery notifications & OTP verification are cancelled.
                </li>
                <li>
                  <strong>Distributor Hub:</strong> Dispatches and active route tracking are cleared.
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Stops:</span>
                <span className="font-semibold text-slate-800">{tripToDelete.totalStops} Shops</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver Pay:</span>
                <span className="font-semibold text-slate-800">₹{tripToDelete.paymentOffered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Goods Value:</span>
                <span className="font-semibold text-slate-800">₹{tripToDelete.goodsValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
              >
                Keep Trip
              </button>
              <button
                id="confirm-delete-trip-btn"
                type="button"
                onClick={handleConfirmDeleteTrip}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Trip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery / Signed Bill Full-Resolution Modal */}
      {viewingProofStop && viewingProofStop.signedBillPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official Proof of Delivery (Signed Bill)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Stop #{viewingProofStop.sequenceNumber}: {viewingProofStop.shopName} ({viewingProofStop.shopkeeperCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProofStop(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Consignment Verification Summary Banner */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Shopkeeper / Store</span>
                <span className="font-bold text-slate-800 truncate block">{viewingProofStop.shopName}</span>
                <span className="font-mono text-[10px] text-blue-600">{viewingProofStop.shopkeeperCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Cargo Verified</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {viewingProofStop.itemsDescription || `${viewingProofStop.quantity} ${viewingProofStop.unitType}`}
                </span>
                <span className="text-[10px] text-slate-500">{viewingProofStop.quantity} {viewingProofStop.unitType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Upload Date</span>
                <span className="font-medium text-slate-700 block">
                  {viewingProofStop.signedBillUploadedAt
                    ? new Date(viewingProofStop.signedBillUploadedAt).toLocaleString('en-IN')
                    : 'Just now'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">✓ Verified before OTP</span>
              </div>
            </div>

            {/* High Resolution Photograph View */}
            <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-2 flex items-center justify-center">
              <img
                src={viewingProofStop.signedBillPhotoUrl}
                alt={`Signed bill for ${viewingProofStop.shopName}`}
                className="max-h-[55vh] object-contain rounded shadow"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-mono truncate">
                File: {viewingProofStop.signedBillFileName || 'Signed_Bill_Proof.png'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingProofStop(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  id="modal-download-proof-btn"
                  onClick={() =>
                    downloadPhotograph(
                      viewingProofStop.signedBillPhotoUrl!,
                      viewingProofStop.signedBillFileName || `Signed_Bill_${viewingProofStop.shopkeeperCode}.png`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Photograph (Proof)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
