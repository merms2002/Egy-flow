import React, { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { sendNotification, requestNotificationPermission } from '../utils/notifications';

const NotificationController = () => {
  const { tasks, updateTask } = useTaskStore();

  useEffect(() => {
    requestNotificationPermission();

    const checkReminders = () => {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.reminderTime && task.reminderTime <= now && !task.completed) {
          sendNotification("Task Reminder", {
            body: `It's time for: ${task.text}`,
            requireInteraction: true,
          });
          
          // Clear the reminder so it doesn't fire again
          updateTask(task.id, { reminderTime: undefined });
        }
      });
    };

    // Check every 10 seconds
    const interval = setInterval(checkReminders, 10000);
    
    // Initial check
    checkReminders();

    return () => clearInterval(interval);
  }, [tasks, updateTask]);

  return null;
};

export default NotificationController;
