import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface TrackingContextType {
  trackingNumbers: string[];
  addTrackingNo: (trackingNo: string) => void;
  removeTrackingNo: (trackingNo: string) => void;
  clearTracking: () => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // สร้าง key ตาม userId (ถ้าไม่ login ใช้ "guest")
  const storageKey = user?.id ? `trackingNumbers_${user.id}` : "trackingNumbers_guest";

  // อ่านค่าจาก sessionStorage ตอนเริ่มต้น
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>(() => {
    const stored = sessionStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  });

  // เมื่อ user เปลี่ยน ให้โหลดข้อมูลของ user คนนั้น
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    setTrackingNumbers(stored ? JSON.parse(stored) : []);
  }, [storageKey]);

  // เมื่อ trackingNumbers เปลี่ยน ให้เก็บลง sessionStorage
  useEffect(() => {
    if (trackingNumbers.length > 0) {
      sessionStorage.setItem(storageKey, JSON.stringify(trackingNumbers));
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [trackingNumbers, storageKey]);

  const addTrackingNo = (value: string) => {
    setTrackingNumbers((prev) => {
      // ไม่ให้ซ้ำ
      if (prev.includes(value)) return prev;
      return [...prev, value];
    });
  };

  const removeTrackingNo = (value: string) => {
    setTrackingNumbers((prev) => prev.filter((no) => no !== value));
  };

  const clearTracking = () => {
    setTrackingNumbers([]);
    sessionStorage.removeItem(storageKey);
  };

  return (
    <TrackingContext.Provider
      value={{ trackingNumbers, addTrackingNo, removeTrackingNo, clearTracking }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error("useTracking must be used within TrackingProvider");
  }
  return context;
}