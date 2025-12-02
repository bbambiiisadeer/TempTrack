import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";

interface Driver {
  id: string;
  name: string;
  regNumber?: string;
  email?: string;
  phoneNumber?: string;
  imageUrl?: string;
  createdAt?: string;
}

interface ParcelData {
  id: string;
  trackingNo: string;
  isDelivered: boolean;
  isShipped: boolean;
  createdAt: string;
  driverId?: string;
  senderAddress?: {
    company?: string;
    name: string;
  };
  recipientAddress?: {
    company?: string;
    name: string;
  };
}

interface ParcelContextType {
  parcels: ParcelData[];
  drivers: Driver[];
  loading: boolean;
  totalPending: number;
  totalShipped: number;
  totalDelivered: number;
  setParcels: React.Dispatch<React.SetStateAction<ParcelData[]>>;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  refreshData: () => Promise<void>;
}

const ParcelContext = createContext<ParcelContextType | undefined>(undefined);

export function ParcelProvider({ children }: { children: ReactNode }) {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  
  const initialLoadCompleted = useRef(false);

  const fetchData = useCallback(async () => {
    const isInitialLoad = !initialLoadCompleted.current;
    
    if (isInitialLoad) {
        setLoading(true);
    }
    
    try {
      const parcelRes = await fetch(`http://localhost:3000/parcel/all`, {
        credentials: "include",
      });
      if (!parcelRes.ok) throw new Error("Failed to fetch parcels");
      const parcelData = await parcelRes.json();
      setParcels(parcelData);

      const driverRes = await fetch(`http://localhost:3000/driver`, {
        credentials: "include",
      });
      if (!driverRes.ok) throw new Error("Failed to fetch drivers");
      const driverData = await driverRes.json();
      setDrivers(driverData);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        initialLoadCompleted.current = true;
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [fetchData]); 

  const totalPending = parcels.filter(
    (p) => !p.isDelivered && !p.isShipped
  ).length;
  
  const totalShipped = parcels.filter(
    (p) => p.isShipped && !p.isDelivered
  ).length;
  
  const totalDelivered = parcels.filter((p) => p.isDelivered).length;

  return (
    <ParcelContext.Provider
      value={{
        parcels,
        drivers,
        loading,
        totalPending,
        totalShipped,
        totalDelivered,
        setParcels,
        setDrivers,
        refreshData: fetchData, 
      }}
    >
      {children}
    </ParcelContext.Provider>
  );
}

export function useParcel() {
  const context = useContext(ParcelContext);
  if (context === undefined) {
    throw new Error("useParcel must be used within a ParcelProvider");
  }
  return context;
}