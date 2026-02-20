export interface Routine {
  id: string;
  title: string;
  category: string;
  time: string; // HH:mm format
  repeatType: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0 for Sunday, 1 for Monday, etc.
  notificationEnabled: boolean;
  boostEnabled: boolean;
  boostInterval: number; // in minutes
  boostAttemptsRemaining: number; // Initialized to 3, decremented on each boost
  isCompletedToday: boolean;
  lastCompletedDate?: string; // ISO string to track if it's been done today
  notes?: string;
  nextScheduledNotificationId?: number;
}

export type Category = 'Medicine' | 'Exercise' | 'Meditation' | 'Meals' | 'Study' | 'Sleep' | 'Custom';
