import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { TaskData } from "../services/firebaseService";

interface TaskListProps {
  tasks: (TaskData & { id: string; creatorEmail?: string; creatorUsername?: string })[];
  loading: boolean;
  onEditTask: (task: TaskData & { id: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskData['status']) => void;
  currentUserId?: string;
  showEditDelete?: boolean;
  showAssignmentInfo?: boolean;
}

export default function TaskList({
  tasks,
  loading,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  currentUserId,
  showEditDelete = true,
  showAssignmentInfo = false
}: TaskListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'in_progress': return '#007AFF';
      case 'completed': return '#34C759';
      default: return '#8E8E93';
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

  const renderTaskItem = ({ item }: { item: TaskData & { id: string; creatorEmail?: string; creatorUsername?: string } }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskDescription}>{item.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.taskDetails}>
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Duration:</Text>
          <Text style={styles.taskValue}>{formatDuration(item.duration)}</Text>
        </View>
        
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Created:</Text>
          <Text style={styles.taskValue}>
            {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
          </Text>
        </View>
        
        {item.completedAt && (
          <View style={styles.taskRow}>
            <Text style={styles.taskLabel}>Completed:</Text>
            <Text style={styles.taskValue}>
              {item.completedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
            </Text>
          </View>
        )}
        
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Assigned to:</Text>
          <Text style={styles.taskValue}>
            {item.creatorUsername || 'Unknown User'}
            {item.assignedBy && item.assignedBy !== item.createdBy && (
              <Text style={styles.adminAssignmentIndicator}> (Assigned by Admin)</Text>
            )}
          </Text>
        </View>
        
        {showAssignmentInfo && item.assignedBy && item.assignedBy !== item.createdBy && (
          <View style={styles.taskRow}>
            <Text style={styles.taskLabel}>Assigned by:</Text>
            <Text style={styles.taskValue}>
              Admin
            </Text>
          </View>
        )}
        
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Status:</Text>
          <View style={styles.statusPickerContainer}>
            <Picker
              selectedValue={item.status}
              style={styles.statusPicker}
              onValueChange={(value) => onStatusChange(item.id, value)}
              mode="dropdown"
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="In Progress" value="in_progress" />
              <Picker.Item label="Completed" value="completed" />
            </Picker>
          </View>
        </View>
      </View>
      
      {showEditDelete && (
        <View style={styles.taskActions}>
          {/* Only show edit/delete buttons if user created the task or if showEditDelete is true */}
          {(!currentUserId || item.createdBy === currentUserId) && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => onEditTask(item)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDeleteTask(item.id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No tasks yet</Text>
        <Text style={styles.emptyStateSubtext}>Add your first task to get started</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      renderItem={renderTaskItem}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
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
  },
  taskValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusPickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
    minWidth: 120,
  },
  statusPicker: {
    height: 40,
    width: '100%',
  },
  adminAssignmentIndicator: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
