export interface Reminder {
  id: string;
  title: string;
  triggerType: 'time' | 'location' | 'condition';
  category: string;
  details: {
    time?: string;
    location?: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    condition?: {
      type: 'weather';
      condition: string;
    };
  };
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
}

