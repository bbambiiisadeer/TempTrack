import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from "react";
import { useAuth } from './AuthContext';

interface NotificationContextType {
  isRead: (id: string) => boolean;
  isDeleted: (id: string) => boolean;
  markAsRead: (ids: string[]) => Promise<void>;
  markAsUnread: (ids: string[]) => Promise<void>;
  markAsDeleted: (ids: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [deletedNotifications, setDeletedNotifications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // โหลดสถานะจาก backend เมื่อ user login
  useEffect(() => {
    const loadNotificationStatus = async () => {
      if (!user?.id) {
        setReadNotifications(new Set());
        setDeletedNotifications(new Set());
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/users/${user.id}/notification-status`,
          {
            credentials: 'include',
          }
        );

        if (res.ok) {
          const data = await res.json();
          setReadNotifications(new Set(data.read || []));
          setDeletedNotifications(new Set(data.deleted || []));
        }
      } catch (err) {
        console.error('Failed to load notification status:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotificationStatus();
  }, [user?.id]);

  const markAsRead = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    // อัพเดท local state ทันที (Optimistic Update)
    const newReadSet = new Set([...readNotifications, ...ids]);
    setReadNotifications(newReadSet);

    // บันทึกไปยัง backend
    try {
      const res = await fetch(
        `http://localhost:3000/users/${user.id}/notification-status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ read: Array.from(newReadSet) }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save read status');
      }
    } catch (err) {
      console.error('Failed to save read status:', err);
      // Rollback ถ้าเกิด error
      setReadNotifications(readNotifications);
    }
  };

  const markAsUnread = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    // อัพเดท local state ทันที (Optimistic Update) - ลบ ids ออกจาก readNotifications
    const newReadSet = new Set(readNotifications);
    ids.forEach(id => newReadSet.delete(id));
    setReadNotifications(newReadSet);

    // บันทึกไปยัง backend
    try {
      const res = await fetch(
        `http://localhost:3000/users/${user.id}/notification-status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ read: Array.from(newReadSet) }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save unread status');
      }
    } catch (err) {
      console.error('Failed to save unread status:', err);
      // Rollback ถ้าเกิด error
      setReadNotifications(readNotifications);
    }
  };

  const markAsDeleted = async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;

    // อัพเดท local state ทันที (Optimistic Update)
    const newDeletedSet = new Set([...deletedNotifications, ...ids]);
    setDeletedNotifications(newDeletedSet);

    // บันทึกไปยัง backend
    try {
      const res = await fetch(
        `http://localhost:3000/users/${user.id}/notification-status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ deleted: Array.from(newDeletedSet) }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save deleted status');
      }
    } catch (err) {
      console.error('Failed to save deleted status:', err);
      // Rollback ถ้าเกิด error
      setDeletedNotifications(deletedNotifications);
    }
  };

  const isRead = (id: string) => readNotifications.has(id);
  const isDeleted = (id: string) => deletedNotifications.has(id);

  if (loading) {
    return null; // หรือแสดง loading indicator
  }

  return (
    <NotificationContext.Provider
      value={{
        isRead,
        isDeleted,
        markAsRead,
        markAsUnread,
        markAsDeleted,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};