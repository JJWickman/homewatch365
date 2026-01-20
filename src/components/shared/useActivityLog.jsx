import { base44 } from '@/api/base44Client';

export const logActivity = async (activityData) => {
  try {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get local timestamp
    const now = new Date();
    const localTimestamp = now.toLocaleString('en-US', { timeZone: userTimezone });

    await base44.entities.ActivityLog.create({
      ...activityData,
      user_timezone: userTimezone,
      local_timestamp: localTimestamp
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};