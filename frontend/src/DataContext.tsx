import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface Driver { id: string; name: string; imageUrl?: string; regNumber?: string; phoneNumber?: string; email?: string; createdAt: string; }
interface Parcel { id: string; trackingNo: string; isDelivered: boolean; isShipped: boolean; driverId?: string; createdAt: string; }

interface DataContextType {
  drivers: Driver[];
  parcels: Parcel[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    const d = await fetch("http://localhost:3000/driver").then(r=>r.json());
    const p = await fetch("http://localhost:3000/parcel/all").then(r=>r.json());
    setDrivers(d);
    setParcels(p);
    setLoading(false);
  };

  useEffect(() => { refreshData(); }, []);

  return (
    <DataContext.Provider value={{ drivers, parcels, loading, refreshData }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext)!;
