import { TaskData } from "../services/firebaseService";

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FF9500';
    case 'in_progress': return '#007AFF';
    case 'completed': return '#34C759';
    default: return '#8E8E93';
  }
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
};

export const getTotalDuration = (tasks: (TaskData & { id: string })[]): number => {
  return tasks.reduce((total, task) => total + (task.duration || 0), 0);
};

export const getCompletedTasks = (tasks: (TaskData & { id: string })[]): number => {
  return tasks.filter(task => task.status === 'completed').length;
};
