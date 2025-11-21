import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface TrackingContextType {
  trackingNo: string | null;
  setTrackingNo: (trackingNo: string | null) => void;
  clearTracking: () => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: ReactNode }) {
  // อ่านค่าจาก sessionStorage ตอนเริ่มต้น
  const [trackingNo, setTrackingNoState] = useState<string | null>(() => {
    return sessionStorage.getItem("trackingNo");
  });

  // เมื่อ trackingNo เปลี่ยน ให้เก็บลง sessionStorage
  useEffect(() => {
    if (trackingNo) {
      sessionStorage.setItem("trackingNo", trackingNo);
    } else {
      sessionStorage.removeItem("trackingNo");
    }
  }, [trackingNo]);

  const setTrackingNo = (value: string | null) => {
    setTrackingNoState(value);
  };

  const clearTracking = () => {
    setTrackingNoState(null);
    sessionStorage.removeItem("trackingNo");
  };

  return (
    <TrackingContext.Provider value={{ trackingNo, setTrackingNo, clearTracking }}>
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