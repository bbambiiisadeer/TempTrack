import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  isRead: (id: string) => boolean;
  isDeleted: (id: string) => boolean;
  markAsRead: (ids: string[]) => Promise<void>;
  markAsUnread: (ids: string[]) => Promise<void>;
  markAsDeleted: (ids: string[]) => Promise<void>;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>; // ✅ เพิ่ม function refresh
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [deletedNotifications, setDeletedNotifications] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ แยก function calculateUnreadCount ออกมาเพื่อเรียกใช้ได้
  const calculateUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const sentRes = await fetch(
        `http://localhost:3000/parcel?userId=${user.id}`,
        { credentials: "include" }
      );
      if (!sentRes.ok) return;
      const sentParcels = await sentRes.json();

      const allNotifications: any[] = [];

      sentParcels.forEach((p: any) => {
        if (p.isDelivered && p.deliveredAt && p.signedAt) {
          allNotifications.push({ id: `${p.id}-delivered` });
        }
        if (p.isShipped && p.shippedAt) {
          allNotifications.push({ id: `${p.id}-shipped` });
        }
      });

      const trackingNumbers = JSON.parse(
        sessionStorage.getItem(`trackingNumbers_${user.id}`) ||
          sessionStorage.getItem("trackingNumbers_guest") ||
          "[]"
      );

      if (trackingNumbers.length > 0) {
        const promises = trackingNumbers.map(async (trackingNo: string) => {
          const formattedTrackingNo = trackingNo.startsWith("#")
            ? trackingNo
            : `#${trackingNo}`;
          try {
            const res = await fetch(
              `http://localhost:3000/parcel/track/${encodeURIComponent(formattedTrackingNo)}`,
              { credentials: "include" }
            );

            if (!res.ok) return null;
            const data = await res.json();
            return Array.isArray(data) ? data : [data];
          } catch {
            return null;
          }
        });

        const results = await Promise.all(promises);
        const incomingParcels = results
          .filter((result): result is any[] => result !== null)
          .flat();

        incomingParcels.forEach((p: any) => {
          if (p.isDelivered && p.deliveredAt) {
            allNotifications.push({ id: `${p.id}-delivered-incoming` });
          }
          if (p.isShipped && p.shippedAt) {
            allNotifications.push({ id: `${p.id}-shipped-incoming` });
          }
        });
      }

      const activeNotifications = allNotifications.filter(
        (n) => !deletedNotifications.has(n.id)
      );
      const unread = activeNotifications.filter(
        (n) => !readNotifications.has(n.id)
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error calculating unread count:", err);
    }
  }, [user?.id, readNotifications, deletedNotifications]);

  // โหลดสถานะจาก backend เมื่อ user login
  useEffect(() => {
    const loadNotificationStatus = async () => {
      if (!user?.id) {
        setReadNotifications(new Set());
        setDeletedNotifications(new Set());
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/users/${user.id}/notification-status`,
          { credentials: "include" }
        );

        if (res.ok) {
          const data = await res.json();
          setReadNotifications(new Set(data.read || []));
          setDeletedNotifications(new Set(data.deleted || []));
        }
      } catch (err) {
        console.error("Failed to load notification status:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNotificationStatus();
  }, [user?.id]);

  // ✅ เช็คการอัปเดต unreadCount ทุก 3 วินาที
  useEffect(() => {
    if (!user?.id) return;

    calculateUnreadCount();
    const interval = setInterval(calculateUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [calculateUnreadCount, user?.id]);

  const markAsRead = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    const newReadSet = new Set([...readNotifications, ...ids]);
    setReadNotifications(newReadSet);
    setUnreadCount((prev) => Math.max(0, prev - ids.length));

    try {
      const res = await fetch(
        `http://localhost:3000/users/${user.id}/notification-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: Array.from(newReadSet) }),
        }
      );

      if (!res.ok) throw new Error("Failed to save read status");
      
      // ✅ Refresh ทันทีหลังจาก mark
      await calculateUnreadCount();
    } catch (err) {
      console.error("Failed to save read status:", err);
      setReadNotifications(readNotifications);
      setUnreadCount((prev) => prev + ids.length);
    }
  };

  const markAsUnread = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    const newReadSet = new Set(readNotifications);
    ids.forEach((id) => newReadSet.delete(id));
    setReadNotifications(newReadSet);
    setUnreadCount((prev) => prev + ids.length);

    try {
      const res = await fetch(
        `http://localhost:3000/users/${user.id}/notification-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: Array.from(newReadSet) }),
        }
      );

      if (!res.ok) throw new Error("Failed to save unread status");
      
      // ✅ Refresh ทันทีหลังจาก mark
      await calculateUnreadCount();
    } catch (err) {
      console.error("Failed to save unread status:", err);
      setReadNotifications(readNotifications);
      setUnreadCount((prev) => prev - ids.length);
    }
  };

  const markAsDeleted = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    const unreadBeingDeleted = ids.filter(
      (id) => !readNotifications.has(id)
    ).length;

    const newDeletedSet = new Set([...deletedNotifications, ...ids]);
    setDeletedNotifications(newDeletedSet);
    setUnreadCount((prev) => Math.max(0, prev - unreadBeingDeleted));

    try {
      const res = await fetch(
        `http://localhost:3000/users/${user.id}/notification-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ deleted: Array.from(newDeletedSet) }),
        }
      );

      if (!res.ok) throw new Error("Failed to save deleted status");
      
      // ✅ Refresh ทันทีหลังจาก delete
      await calculateUnreadCount();
    } catch (err) {
      console.error("Failed to save deleted status:", err);
      setDeletedNotifications(deletedNotifications);
      setUnreadCount((prev) => prev + unreadBeingDeleted);
    }
  };

  const isRead = (id: string) => readNotifications.has(id);
  const isDeleted = (id: string) => deletedNotifications.has(id);

  if (loading) return null;

  return (
    <NotificationContext.Provider
      value={{
        isRead,
        isDeleted,
        markAsRead,
        markAsUnread,
        markAsDeleted,
        unreadCount,
        setUnreadCount,
        refreshUnreadCount: calculateUnreadCount, // ✅ ส่ง function ออกไป
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};