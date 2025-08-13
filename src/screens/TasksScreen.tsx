import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService } from "../services/firebaseService";
import type { TaskData, UserData } from "../services/firebaseService";
import { useFocusEffect } from '@react-navigation/native';

interface TaskWithProject extends TaskData {
  id: string;
  creatorEmail?: string;
  projectTitle?: string;
}

export default function TasksScreen({ navigation }: any) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskData['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'duration' | 'status'>('createdAt');

  useEffect(() => {
    console.log('Current user:', currentUser); // Add this line
    if (currentUser) {
      console.log('User authenticated, loading data...'); // Add this line
      loadUserData();
      loadTasks(); // Remove the initialization dependency to avoid race conditions
    } else {
      console.log('No user authenticated'); // Add this line
    }
  }, [currentUser]);

  // Refresh tasks when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        loadTasks();
      }
    }, [currentUser])
  );

  const loadUserData = async () => {
    if (currentUser) {
      try {
        const data = await FirebaseService.getUserData(currentUser.uid);
        setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('Loading tasks...'); // Add logging
      
      const allTasks = await FirebaseService.getAllTasks();
      console.log('Raw tasks from Firebase:', allTasks); // Add logging
      
      if (allTasks.length === 0) {
        console.log('No tasks found in Firebase'); // Add logging
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // Enhance tasks with project and user information
      const enhancedTasks = await Promise.all(
        allTasks.map(async (task) => {
          try {
            const [userData, projectData] = await Promise.all([
              FirebaseService.getUserData(task.createdBy),
              FirebaseService.getProject(task.projectId)
            ]);
            
            return {
              ...task,
              creatorEmail: userData?.email || 'Unknown User',
              projectTitle: projectData?.title || 'Unknown Project'
            };
          } catch (error) {
            console.error(`Error enhancing task ${task.id}:`, error);
            return {
              ...task,
              creatorEmail: 'Unknown User',
              projectTitle: 'Unknown Project'
            };
          }
        })
      );
      
      console.log('Enhanced tasks:', enhancedTasks); // Add logging
      setTasks(enhancedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
      setTasks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTaskPress = (task: TaskWithProject) => {
    navigation.navigate('ProjectDetail', { projectId: task.projectId });
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskData['status']) => {
    try {
      await FirebaseService.updateTask(taskId, { status: newStatus });
      // Update the local state immediately for better UX
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );
      // Then refresh to get the latest data
      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

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

  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks]; // Create a copy to avoid mutating original array
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filterStatus);
    }
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          // Handle cases where createdAt might be undefined
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        case 'duration':
          return b.duration - a.duration;
        case 'status':
          const statusOrder = { 'pending': 0, 'in_progress': 1, 'completed': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });
    
    return filteredTasks;
  };

  const renderTaskItem = ({ item }: { item: TaskWithProject }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => handleTaskPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.taskDetails}>
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Project:</Text>
          <Text style={styles.taskValue}>{item.projectTitle}</Text>
        </View>
        
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
          <Text style={styles.taskLabel}>Created by:</Text>
          <Text style={styles.taskValue}>{item.creatorEmail || 'Unknown User'}</Text>
        </View>
        
        {item.notes && (
          <View style={styles.taskRow}>
            <Text style={styles.taskLabel}>Notes:</Text>
            <Text style={styles.taskValue}>{item.notes}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.statusButton]}
          onPress={() => {
            const nextStatus = getNextStatus(item.status);
            if (nextStatus) {
              handleStatusChange(item.id, nextStatus);
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {getNextStatusText(item.status)}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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

  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const totalDuration = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return { total, pending, inProgress, completed, totalDuration };
  };

  const stats = getTaskStats();
  const filteredTasks = getFilteredAndSortedTasks();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Tasks</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Task Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{formatDuration(stats.totalDuration)}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
      </View>

      {/* Filters and Sorting */}
      <View style={styles.controlsContainer}>
        <View style={styles.filterContainer}>
          <Text style={styles.controlLabel}>Filter by Status:</Text>
          <View style={styles.filterButtons}>
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive
                ]}>
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.controlLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            {(['createdAt', 'duration', 'status'] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.sortButton,
                  sortBy === sort && styles.sortButtonActive
                ]}
                onPress={() => setSortBy(sort)}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === sort && styles.sortButtonTextActive
                ]}>
                  {sort === 'createdAt' ? 'Date' : sort === 'duration' ? 'Time' : 'Status'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tasksList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tasks found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filterStatus !== 'all' 
                ? `No tasks with status "${filterStatus.replace('_', ' ')}"`
                : 'Create some tasks in your projects to get started'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sortContainer: {
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  tasksList: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
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
    marginBottom: 6,
  },
  taskLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
    fontWeight: '500',
  },
  taskValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  taskActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    textAlign: 'center',
  },
});
