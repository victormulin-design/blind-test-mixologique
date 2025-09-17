import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { CheckIcon, CloseIcon } from '../IconComponents';

const Notification: React.FC = () => {
  const { notification } = useNotifications();

  if (!notification) {
    return null;
  }

  const { message, type } = notification;

  const baseClasses = "fixed top-5 right-5 z-[200] flex items-center gap-4 px-6 py-3 rounded-lg shadow-lg text-lg text-white animate-fade-in";
  const typeClasses = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  const Icon = {
    success: <CheckIcon className="h-6 w-6" />,
    error: <CloseIcon className="h-6 w-6" />,
    info: null,
  }[type];

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {Icon}
      <span>{message}</span>
    </div>
  );
};

export default Notification;
