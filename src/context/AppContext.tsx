import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Trip, OrderRequest, NotificationItem, DriverVerificationRecord, UserRole, TripStatus, StopStatus } from '../types';
import { INITIAL_USERS, INITIAL_TRIPS, INITIAL_ORDER_REQUESTS, INITIAL_PENDING_DRIVERS, INITIAL_NOTIFICATIONS } from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  users: User[];
  trips: Trip[];
  orders: OrderRequest[];
  pendingDrivers: DriverVerificationRecord[];
  notifications: NotificationItem[];
  driverIsOnline: boolean;
  toggleDriverOnline: () => void;
  
  // Trip Actions
  createTrip: (tripData: Omit<Trip, 'id' | 'createdAt' | 'status' | 'distributorId' | 'distributorName' | 'distributorPhone'>) => void;
  acceptTrip: (tripId: string) => void;
  placeBid: (tripId: string, amount: number) => void;
  startTrip: (tripId: string) => void;
  updateStopStatus: (tripId: string, stopId: string, status: StopStatus, otp?: string) => { success: boolean; message: string };
  completeTrip: (tripId: string) => void;
  deleteTrip: (tripId: string) => boolean;
  updateTrip: (tripId: string, updatedData: Partial<Trip>) => void;
  updateDriverLocation: (tripId: string, lat: number, lng: number, speed?: number) => void;
  uploadSignedBillPhoto: (tripId: string, stopId: string, photoUrl: string, fileName?: string) => string;

  // Order Actions
  createOrderRequest: (orderData: Omit<OrderRequest, 'id' | 'createdAt' | 'status' | 'shopkeeperId' | 'shopkeeperName' | 'shopName' | 'contactNumber' | 'address'>) => void;
  updateOrderStatus: (orderId: string, status: 'accepted' | 'declined' | 'assigned_to_trip') => void;

  // Admin Actions
  verifyDriver: (driverId: string, status: 'approved' | 'rejected') => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'time' | 'read'>) => void;

  // Toast feedback
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('dl_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserId = localStorage.getItem('dl_current_user_id');
    if (savedUserId) {
      const savedUsers: User[] = localStorage.getItem('dl_users')
        ? JSON.parse(localStorage.getItem('dl_users')!)
        : INITIAL_USERS;
      const found = savedUsers.find((u) => u.id === savedUserId);
      if (found) return found;
    }
    return INITIAL_USERS[0];
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('dl_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });
  const [orders, setOrders] = useState<OrderRequest[]>(() => {
    const saved = localStorage.getItem('dl_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDER_REQUESTS;
  });
  const [pendingDrivers, setPendingDrivers] = useState<DriverVerificationRecord[]>(() => {
    const saved = localStorage.getItem('dl_pending_drivers');
    return saved ? JSON.parse(saved) : INITIAL_PENDING_DRIVERS;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('dl_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [driverIsOnline, setDriverIsOnline] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('dl_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('dl_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('dl_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('dl_pending_drivers', JSON.stringify(pendingDrivers));
  }, [pendingDrivers]);

  useEffect(() => {
    localStorage.setItem('dl_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const switchRole = (role: UserRole) => {
    const target = users.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('dl_current_user_id', target.id);
      showToast(`Switched view to ${role.toUpperCase()}: ${target.fullName}`);
    }
  };

  const toggleDriverOnline = () => {
    setDriverIsOnline((prev) => {
      const next = !prev;
      showToast(next ? 'You are now ONLINE. Nearby trips visible.' : 'You are now OFFLINE.');
      return next;
    });
  };

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'time' | 'read'>) => {
    const newItem: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  const createTrip = (
    tripData: Omit<Trip, 'id' | 'createdAt' | 'status' | 'distributorId' | 'distributorName' | 'distributorPhone'>
  ) => {
    if (!currentUser) {
      showToast('Please log in first.');
      return;
    }
    const newTripId = `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrip: Trip = {
      ...tripData,
      id: newTripId,
      distributorId: currentUser.id,
      distributorName: currentUser.businessName || currentUser.fullName,
      distributorPhone: currentUser.phone,
      status: 'published',
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      stops: tripData.stops.map((stop, idx) => ({
        ...stop,
        id: `stop-${newTripId}-${idx + 1}`,
        tripId: newTripId,
        sequenceNumber: idx + 1,
        deliveryOtp: String(Math.floor(100000 + Math.random() * 900000)),
        status: 'pending',
      })),
    };

    setTrips((prev) => [newTrip, ...prev]);
    showToast(`Trip ${newTripId} published for captions!`);
    addNotification({
      userId: 'user-driver-1',
      title: 'New Trip Available',
      body: `${newTrip.distributorName} published a trip with ${newTrip.totalStops} stops (₹${newTrip.paymentOffered}).`,
      type: 'trip',
    });
  };

  const acceptTrip = (tripId: string) => {
    if (!currentUser) return;
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id === tripId) {
          return {
            ...trip,
            driverId: currentUser.id,
            driverName: currentUser.fullName,
            driverPhone: currentUser.phone,
            driverVehicleNumber: currentUser.vehicleNumber || 'TS 09 UA 4521',
            status: 'assigned',
            assignedAt: new Date().toISOString(),
          };
        }
        return trip;
      })
    );
    showToast(`Trip ${tripId} accepted! Prepare for pickup.`);
    addNotification({
      userId: 'user-dist-1',
      title: `Driver Assigned to ${tripId}`,
      body: `${currentUser.fullName} accepted your trip. Vehicle: ${currentUser.vehicleNumber || 'TS 09 UA 4521'}`,
      type: 'trip',
    });
  };

  const placeBid = (tripId: string, amount: number) => {
    if (!currentUser) return;
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id === tripId) {
          const currentBids = trip.bids || [];
          return {
            ...trip,
            bids: [
              ...currentBids,
              {
                id: `bid-${Date.now()}`,
                tripId,
                driverId: currentUser.id,
                driverName: currentUser.fullName,
                driverPhone: currentUser.phone,
                driverRating: 4.8,
                driverVehicleNumber: currentUser.vehicleNumber || 'TS 09 UA 4521',
                offeredAmount: amount,
                status: 'offered',
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return trip;
      })
    );
    showToast(`Your bid of ₹${amount} was submitted to the distributor!`);
  };

  const startTrip = (tripId: string) => {
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id === tripId) {
          const updatedStops = trip.stops.map((s, idx) => ({
            ...s,
            status: (idx === 0 ? 'en_route' : 'pending') as StopStatus,
          }));
          return {
            ...trip,
            status: 'in_progress' as TripStatus,
            startedAt: new Date().toISOString(),
            stops: updatedStops,
          };
        }
        return trip;
      })
    );
    showToast(`Trip ${tripId} started! Delivery sequence en route.`);
  };

  const updateStopStatus = (tripId: string, stopId: string, newStatus: StopStatus, otp?: string) => {
    let result = { success: true, message: 'Stop status updated' };

    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id !== tripId) return trip;

        const targetStop = trip.stops.find((s) => s.id === stopId);
        if (!targetStop) return trip;

        // If delivering, verify OTP
        if (newStatus === 'delivered' && otp && otp.trim() !== targetStop.deliveryOtp) {
          result = { success: false, message: 'Invalid 6-digit delivery OTP! Check with shopkeeper.' };
          return trip;
        }

        const updatedStops = trip.stops.map((stop) => {
          if (stop.id === stopId) {
            return {
              ...stop,
              status: newStatus,
              arrivedAt: newStatus === 'arrived' ? new Date().toISOString() : stop.arrivedAt,
              deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : stop.deliveredAt,
            };
          }
          return stop;
        });

        // Check if all stops are delivered
        const allDelivered = updatedStops.every((s) => s.status === 'delivered');
        const nextPendingIndex = updatedStops.findIndex((s) => s.status === 'pending');
        
        // If current stop was delivered and there's a next stop, mark next as en_route
        if (newStatus === 'delivered' && nextPendingIndex !== -1) {
          updatedStops[nextPendingIndex].status = 'en_route';
        }

        return {
          ...trip,
          status: (allDelivered ? 'completed' : trip.status) as TripStatus,
          completedAt: allDelivered ? new Date().toISOString() : trip.completedAt,
          stops: updatedStops,
        };
      })
    );

    if (result.success) {
      showToast(newStatus === 'delivered' ? 'Stop verified & delivered!' : 'Arrived at shop!');
    } else {
      showToast(result.message);
    }
    return result;
  };

  const completeTrip = (tripId: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
      )
    );
    showToast(`Trip ${tripId} marked as Completed! Payment processed.`);
  };

  const deleteTrip = (tripId: string): boolean => {
    const target = trips.find((t) => t.id === tripId);
    if (!target) return false;

    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    showToast(`Trip ${tripId} has been deleted and removed from all drivers and shopkeepers.`);
    addNotification({
      userId: 'user-driver-1',
      title: 'Trip Deleted by Distributor',
      body: `Trip ${tripId} (${target.totalStops} stops) was cancelled and deleted by the distributor.`,
      type: 'trip',
    });
    return true;
  };

  const updateTrip = (tripId: string, updatedData: Partial<Trip>) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          return {
            ...t,
            ...updatedData,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    showToast(`Trip ${tripId} details updated successfully!`);
    addNotification({
      userId: 'user-driver-1',
      title: 'Trip Details Updated',
      body: `Trip ${tripId} was updated with modified route/stops by the distributor.`,
      type: 'trip',
    });
  };

  const updateDriverLocation = (tripId: string, lat: number, lng: number, speed?: number) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              currentDriverLat: lat,
              currentDriverLng: lng,
              driverSpeedKmh: speed ?? t.driverSpeedKmh,
            }
          : t
      )
    );
  };

  const uploadSignedBillPhoto = (tripId: string, stopId: string, photoUrl: string, fileName?: string): string => {
    let generatedOtp = '';
    let shopName = '';
    let shopCode = '';

    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id !== tripId) return trip;
        const targetStop = trip.stops.find((s) => s.id === stopId);
        if (!targetStop) return trip;

        shopName = targetStop.shopName;
        shopCode = targetStop.shopkeeperCode;
        // Keep existing OTP or generate a new 6-digit one
        generatedOtp = targetStop.deliveryOtp || String(Math.floor(100000 + Math.random() * 900000));

        const updatedStops = trip.stops.map((s) => {
          if (s.id === stopId) {
            return {
              ...s,
              signedBillPhotoUrl: photoUrl,
              signedBillUploadedAt: new Date().toISOString(),
              signedBillFileName: fileName || `Signed_Bill_${s.shopkeeperCode || 'Shop'}_${tripId}.png`,
              billChecked: true,
              otpGenerated: true,
              deliveryOtp: generatedOtp,
            };
          }
          return s;
        });

        return {
          ...trip,
          stops: updatedStops,
        };
      })
    );

    // Notify Distributor that the signed bill photo is available to download
    addNotification({
      userId: 'user-dist-1',
      title: 'Signed Bill Uploaded (Proof Ready)',
      body: `Shopkeeper ${shopName || 'Kirana'} (${shopCode}) checked items and uploaded signed bill. Download proof now available!`,
      type: 'trip',
    });

    // Notify Driver that bill is signed and OTP is generated
    addNotification({
      userId: 'user-driver-1',
      title: 'Bill Signed & Handover OTP Generated',
      body: `Shopkeeper ${shopName || 'Kirana'} signed the bill & uploaded proof. Collect the 6-digit OTP to complete delivery!`,
      type: 'trip',
    });

    showToast('Signed bill uploaded successfully! 6-digit OTP generated for handover.');
    return generatedOtp;
  };

  const createOrderRequest = (
    orderData: Omit<OrderRequest, 'id' | 'createdAt' | 'status' | 'shopkeeperId' | 'shopkeeperName' | 'shopName' | 'contactNumber' | 'address'>
  ) => {
    const newOrder: OrderRequest = {
      ...orderData,
      id: `ORD-${Math.floor(900 + Math.random() * 90)}`,
      shopkeeperId: currentUser.id,
      shopkeeperName: currentUser.fullName,
      shopName: currentUser.businessName || 'Kirana Store',
      contactNumber: currentUser.phone,
      address: 'Shop #3, Koti Main Road, Hyderabad',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    showToast('Order request sent to distributor!');
    addNotification({
      userId: 'user-dist-1',
      title: 'New Stock Order Request',
      body: `${newOrder.shopName} requested ${newOrder.quantity} ${newOrder.unitType} of ${newOrder.itemsDescription}.`,
      type: 'order',
    });
  };

  const updateOrderStatus = (orderId: string, status: 'accepted' | 'declined' | 'assigned_to_trip') => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    showToast(`Order ${orderId} marked as ${status.toUpperCase()}`);
  };

  const verifyDriver = (driverId: string, status: 'approved' | 'rejected') => {
    setPendingDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, verificationStatus: status } : d))
    );
    showToast(`Driver application ${status.toUpperCase()} successfully.`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        users,
        trips,
        orders,
        pendingDrivers,
        notifications,
        driverIsOnline,
        toggleDriverOnline,
        createTrip,
        acceptTrip,
        placeBid,
        startTrip,
        updateStopStatus,
        completeTrip,
        deleteTrip,
        updateTrip,
        updateDriverLocation,
        uploadSignedBillPhoto,
        createOrderRequest,
        updateOrderStatus,
        verifyDriver,
        markNotificationRead,
        addNotification,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
