import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
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

interface SensorData {
  temp: number;
  timestamp: string;
  device?: string;
}

interface ParcelData {
  id: string;
  trackingNo: string;
  isDelivered: boolean;
  isShipped: boolean;
  createdAt: string;
  driverId?: string;
  driver?: {
    name: string;
    regNumber?: string;
  };
  senderAddress?: { company?: string; name: string };
  recipientAddress?: { company?: string; name: string };
  shippedAt?: string;
  deliveredAt?: string;
  signedAt?: string;
  temperatureRangeMin?: number;
  temperatureRangeMax?: number;
}

interface ParcelContextType {
  parcels: ParcelData[];
  drivers: Driver[];
  loading: boolean;
  totalPending: number;
  totalShipped: number;
  totalDelivered: number;
  sensorHistory: Record<string, SensorData[]>;
  selectedParcel: ParcelData | null;
  setParcels: React.Dispatch<React.SetStateAction<ParcelData[]>>;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  setSelectedParcel: (parcel: ParcelData | null) => void;
  addSensorData: (trackingNo: string, data: SensorData) => void;
  refreshData: () => Promise<void>;
  ensureSensorDataLoaded: (trackingNo: string) => Promise<void>;
  lastUpdateTime: number;
}

const ParcelContext = createContext<ParcelContextType | undefined>(undefined);

export function ParcelProvider({ children }: { children: ReactNode }) {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const initialLoadCompleted = useRef(false);
  const loadingSensorFor = useRef<Set<string>>(new Set());
  const sensorFetchedRef = useRef<Set<string>>(new Set()); // ✅ Track ว่า fetch แล้ว

  const [selectedParcel, setSelectedParcelState] = useState<ParcelData | null>(() => {
    const saved = localStorage.getItem("selectedParcel");
    return saved ? JSON.parse(saved) : null;
  });

  // ✅ ใช้ ref แทน state เพื่อ sync ทันที
  const getSavedSensorHistory = () => {
    const saved = localStorage.getItem("sensorHistory");
    return saved ? JSON.parse(saved) : {};
  };
  
  const sensorHistoryRef = useRef<Record<string, SensorData[]>>(getSavedSensorHistory());

  const [sensorHistory, setSensorHistory] = useState<Record<string, SensorData[]>>(sensorHistoryRef.current);

  const setSelectedParcel = useCallback((parcel: ParcelData | null) => {
    setSelectedParcelState(parcel);
    if (parcel) {
      localStorage.setItem("selectedParcel", JSON.stringify(parcel));
    } else {
      localStorage.removeItem("selectedParcel");
    }
  }, []);

  const addSensorData = useCallback((trackingNo: string, newData: SensorData) => {
    const currentHistory = sensorHistoryRef.current[trackingNo] || [];
    if (currentHistory.some(item => item.timestamp === newData.timestamp)) return;
    
    const updatedHistory = [newData, ...currentHistory].slice(0, 1000);
    sensorHistoryRef.current = { ...sensorHistoryRef.current, [trackingNo]: updatedHistory };
    
    localStorage.setItem("sensorHistory", JSON.stringify(sensorHistoryRef.current));
    setSensorHistory(sensorHistoryRef.current);
    setLastUpdateTime(Date.now());
  }, []);

  const ensureSensorDataLoaded = useCallback(async (trackingNo: string) => {
    // ✅ ตรวจสอบว่า fetch ไปแล้วหรือยัง
    if (sensorFetchedRef.current.has(trackingNo) || loadingSensorFor.current.has(trackingNo)) {
      return;
    }

    loadingSensorFor.current.add(trackingNo);
    
    try {
      const response = await fetch("http://13.229.150.123:3000/api/temp");
      if (response.ok) {
        const data = await response.json();
        if (data?.temp && data?.timestamp) {
          addSensorData(trackingNo, {
            device: data.sensor_id,
            temp: data.temp,
            timestamp: data.timestamp
          });
          sensorFetchedRef.current.add(trackingNo); // ✅ Mark ว่า fetch แล้ว
        }
      }
    } catch (err) {
      console.error(`Failed to load sensor data for ${trackingNo}:`, err);
    } finally {
      loadingSensorFor.current.delete(trackingNo);
    }
  }, [addSensorData]);

  const fetchData = useCallback(async () => {
    try {
      const [parcelRes, driverRes] = await Promise.all([
        fetch(`http://localhost:3000/parcel/all`, { credentials: "include" }),
        fetch(`http://localhost:3000/driver`, { credentials: "include" })
      ]);

      if (parcelRes.ok) {
        const data = await parcelRes.json();
        setParcels(data);
        setLastUpdateTime(Date.now());
      }
      
      if (driverRes.ok) {
        const data = await driverRes.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      initialLoadCompleted.current = true;
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 3000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // ✅ Sensor polling - เฉพาะ parcel ที่กำลัง ship
  useEffect(() => {
    const fetchRealtimeSensor = async () => {
      try {
        const response = await fetch("http://13.229.150.123:3000/api/temp");
        if (response.ok) {
          const data = await response.json();
          if (data?.temp && data?.timestamp) {
            parcels.forEach(parcel => {
              // ✅ เพิ่ม sensor เฉพาะ parcel ที่กำลัง ship (ยังไม่ deliver)
              if (parcel.isShipped && !parcel.isDelivered) {
                addSensorData(parcel.trackingNo, {
                  device: data.sensor_id,
                  temp: data.temp,
                  timestamp: data.timestamp
                });
              }
              // ✅ ถ้า deliver แล้ว ไม่เพิ่ม sensor ใหม่
            });
          }
        }
      } catch (err) {
        console.error("Sensor fetch error:", err);
      }
    };

    fetchRealtimeSensor();
    const sensorInterval = setInterval(fetchRealtimeSensor, 1000);
    return () => clearInterval(sensorInterval);
  }, [parcels, addSensorData]);

  const totalPending = useMemo(() => parcels.filter(p => !p.isDelivered && !p.isShipped).length, [parcels]);
  const totalShipped = useMemo(() => parcels.filter(p => p.isShipped && !p.isDelivered).length, [parcels]);
  const totalDelivered = useMemo(() => parcels.filter(p => p.isDelivered).length, [parcels]);

  return (
    <ParcelContext.Provider value={{
      parcels, drivers, loading, totalPending, totalShipped, totalDelivered,
      sensorHistory, selectedParcel, setParcels, setDrivers, setSelectedParcel,
      addSensorData, refreshData: fetchData, ensureSensorDataLoaded,
      lastUpdateTime
    }}>
      {children}
    </ParcelContext.Provider>
  );
}

export function useParcel() {
  const context = useContext(ParcelContext);
  if (!context) throw new Error("useParcel must be used within a ParcelProvider");
  return context;
}