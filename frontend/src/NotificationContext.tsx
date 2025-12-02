import { createContext, useContext, useState, useEffect } from "react";
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(
    new Set()
  );
  const [deletedNotifications, setDeletedNotifications] = useState<Set<string>>(
    new Set()
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
          {
            credentials: "include",
          }
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

  // คำนวณ unreadCount จากการเปลี่ยนแปลงของ readNotifications และ deletedNotifications
  useEffect(() => {
    const calculateUnreadCount = async () => {
      if (!user?.id) {
        setUnreadCount(0);
        return;
      }

      try {
        // Fetch sent parcels
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

        // Fetch incoming parcels from TrackingContext
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
                `http://localhost:3000/parcel/track/${encodeURIComponent(
                  formattedTrackingNo
                )}`,
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

          // Process incoming parcels
          incomingParcels.forEach((p: any) => {
            if (p.isDelivered && p.deliveredAt) {
              allNotifications.push({ id: `${p.id}-delivered-incoming` });
            }
            if (p.isShipped && p.shippedAt) {
              allNotifications.push({ id: `${p.id}-shipped-incoming` });
            }
          });
        }

        // Filter out deleted and count unread
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
    };

    calculateUnreadCount();
  }, [user?.id, readNotifications, deletedNotifications]);

  const markAsRead = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    // อัพเดท local state ทันที (Optimistic Update)
    const newReadSet = new Set([...readNotifications, ...ids]);
    setReadNotifications(newReadSet);

    // อัพเดท unreadCount ทันที
    setUnreadCount((prev) => Math.max(0, prev - ids.length));

    // บันทึกไปยัง backend
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

      if (!res.ok) {
        throw new Error("Failed to save read status");
      }
    } catch (err) {
      console.error("Failed to save read status:", err);
      // Rollback ถ้าเกิด error
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

      if (!res.ok) {
        throw new Error("Failed to save unread status");
      }
    } catch (err) {
      console.error("Failed to save unread status:", err);
      // Rollback ถ้าเกิด error
      setReadNotifications(readNotifications);
      setUnreadCount((prev) => prev - ids.length);
    }
  };

  const markAsDeleted = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    // นับจำนวน unread ที่จะถูกลบ
    const unreadBeingDeleted = ids.filter(
      (id) => !readNotifications.has(id)
    ).length;

    // อัพเดท local state ทันที (Optimistic Update)
    const newDeletedSet = new Set([...deletedNotifications, ...ids]);
    setDeletedNotifications(newDeletedSet);

    // อัพเดท unreadCount ทันที
    setUnreadCount((prev) => Math.max(0, prev - unreadBeingDeleted));

    // บันทึกไปยัง backend
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

      if (!res.ok) {
        throw new Error("Failed to save deleted status");
      }
    } catch (err) {
      console.error("Failed to save deleted status:", err);
      // Rollback ถ้าเกิด error
      setDeletedNotifications(deletedNotifications);
      setUnreadCount((prev) => prev + unreadBeingDeleted);
    }
  };

  const isRead = (id: string) => readNotifications.has(id);
  const isDeleted = (id: string) => deletedNotifications.has(id);

  if (loading) {
    return null;
  }

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
