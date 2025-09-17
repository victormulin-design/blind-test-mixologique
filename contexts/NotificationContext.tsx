import React, { useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  message: string;
  type: NotificationType;
  id: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  notification: NotificationState | null;
}

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const newId = Date.now();
    setNotification({ message, type, id: newId });

    const newTimeoutId = window.setTimeout(() => {
      setNotification((current) => (current?.id === newId ? null : current));
    }, 5000); // Notification disappears after 5 seconds
    setTimeoutId(newTimeoutId);
  }, [timeoutId]);

  return (
    <NotificationContext.Provider value={{ showNotification, notification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
