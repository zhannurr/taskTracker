import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from "react-native";
import type { TaskData } from "../services/firebaseService";

interface TaskCardProps {
  task: TaskData & { id: string; creatorEmail?: string; projectTitle?: string };
  onEdit?: (task: TaskData & { id: string }) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskData['status']) => void;
  onPress?: (task: TaskData & { id: string; creatorEmail?: string; projectTitle?: string }) => void;
  showProjectInfo?: boolean;
  showActions?: boolean;
}

export default function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onPress,
  showProjectInfo = false,
  showActions = true
}: TaskCardProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'in_progress': return '#007AFF';
      case 'completed': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getNextStatus = (currentStatus: string): TaskData['status'] | null => {
    switch (currentStatus) {
      case 'pending': return 'in_progress';
      case 'in_progress': return 'completed';
      case 'completed': return null;
      default: return null;
    }
  };

  const getNextStatusText = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'pending': return 'Start';
      case 'in_progress': return 'Complete';
      case 'completed': return 'Completed';
      default: return 'Update';
    }
  };

  const formatDuration = (minutes: number): string => {
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

  const handlePress = () => {
    if (onPress) {
      onPress(task);
    }
  };

  const handleStatusChange = () => {
    const nextStatus = getNextStatus(task.status);
    if (nextStatus) {
      onStatusChange(task.id, nextStatus);
    }
  };

  const TaskContent = (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskDescription}>{task.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{task.status.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.taskDetails}>
        {showProjectInfo && task.projectTitle && (
          <View style={styles.taskRow}>
            <Text style={styles.taskLabel}>Project:</Text>
            <Text style={styles.taskValue}>{task.projectTitle}</Text>
          </View>
        )}
        
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Duration:</Text>
          <Text style={styles.taskValue}>{formatDuration(task.duration)}</Text>
        </View>
        
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Created:</Text>
          <Text style={styles.taskValue}>
            {task.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
          </Text>
        </View>
        
        {task.completedAt && (
          <View style={styles.taskRow}>
            <Text style={styles.taskLabel}>Completed:</Text>
            <Text style={styles.taskValue}>
              {task.completedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
            </Text>
          </View>
        )}
        
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Created by:</Text>
          <Text style={styles.taskValue}>{task.creatorEmail || 'Unknown User'}</Text>
        </View>
        
        {task.notes && (
          <View style={styles.taskRow}>
            <Text style={styles.taskLabel}>Notes:</Text>
            <Text style={styles.taskValue}>{task.notes}</Text>
          </View>
        )}
      </View>
      
      {showActions && (
        <View style={styles.taskActions}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(task)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={handleStatusChange}
          >
            <Text style={styles.actionButtonText}>
              {getNextStatusText(task.status)}
            </Text>
          </TouchableOpacity>
          
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(task.id)}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {TaskContent}
      </TouchableOpacity>
    );
  }

  return TaskContent;
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  taskDetails: {
    marginBottom: 16,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 80,
  },
  taskValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  statusButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
