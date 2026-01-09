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
  
  // Create key based on userId (if not logged in, use "guest")
  const storageKey = user?.id ? `trackingNumbers_${user.id}` : "trackingNumbers_guest";

  // 1. Read from localStorage on initialization
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // 2. When storageKey changes (e.g., user logs in/out), load that specific user's data
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setTrackingNumbers(stored ? JSON.parse(stored) : []);
  }, [storageKey]);

  // 3. When trackingNumbers changes, save to localStorage
  useEffect(() => {
    if (trackingNumbers.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(trackingNumbers));
    } else {
      // If the array is empty, we remove the key to keep storage clean
      localStorage.removeItem(storageKey);
    }
  }, [trackingNumbers, storageKey]);

  const addTrackingNo = (value: string) => {
    setTrackingNumbers((prev) => {
      // Prevent duplicates
      if (prev.includes(value)) return prev;
      return [...prev, value];
    });
  };

  const removeTrackingNo = (value: string) => {
    setTrackingNumbers((prev) => prev.filter((no) => no !== value));
  };

  const clearTracking = () => {
    setTrackingNumbers([]);
    localStorage.removeItem(storageKey);
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