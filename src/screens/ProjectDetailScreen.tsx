import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService, ProjectData, TaskData, UserData } from "../services/firebaseService";
import { useFocusEffect } from '@react-navigation/native';

interface ProjectDetailScreenProps {
  route: any;
  navigation: any;
}

export default function ProjectDetailScreen({ route, navigation }: ProjectDetailScreenProps) {
  const { currentUser } = useAuth();
  const { projectId } = route.params;
  
  const [project, setProject] = useState<(ProjectData & { id: string }) | null>(null);
  const [tasks, setTasks] = useState<(TaskData & { id: string; creatorEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<(TaskData & { id: string }) | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    duration: '',
    notes: ''
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadTasks();
      if (currentUser) {
        loadUserData();
      }
      // Initialize tasks collection to ensure it exists
      FirebaseService.initializeTasksCollection().catch(error => {
        console.log('Error initializing tasks collection:', error);
      });
    }
  }, [projectId, currentUser]);

  // Refresh tasks when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (projectId) {
        loadTasks();
      }
    }, [projectId])
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

  const loadProject = async () => {
    try {
      const projectData = await FirebaseService.getProject(projectId);
      setProject(projectData);
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Error', 'Failed to load project');
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await FirebaseService.getProjectTasksWithUsers(projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userData?.role === 'admin';

  const handleAddTask = () => {
    setEditingTask(null);
    setFormData({ description: '', duration: '', notes: '' });
    setModalVisible(true);
  };

  const handleEditTask = (task: TaskData & { id: string }) => {
    setEditingTask(task);
    setFormData({
      description: task.description,
      duration: task.duration.toString(),
      notes: task.notes || ''
    });
    setModalVisible(true);
  };

  const handleSaveTask = async () => {
    console.log('handleSaveTask called with formData:', formData);
    console.log('currentUser:', currentUser?.uid);
    console.log('projectId:', projectId);
    
    if (!formData.description.trim() || !formData.duration.trim()) {
      Alert.alert('Error', 'Please fill description and duration');
      return;
    }

    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Duration must be a positive number');
      return;
    }

    if (!projectId) {
      Alert.alert('Error', 'Project ID is missing');
      return;
    }

    if (!currentUser?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      if (editingTask) {
        console.log('Updating existing task:', editingTask.id);
        await FirebaseService.updateTask(editingTask.id, {
          description: formData.description.trim(),
          duration,
          notes: formData.notes.trim() || undefined
        });
        Alert.alert('Success', 'Task updated successfully');
      } else {
        console.log('Creating new task');
        const taskData = {
          description: formData.description.trim(),
          duration,
          notes: formData.notes.trim() || undefined,
          status: 'pending' as const,
          projectId,
          createdBy: currentUser.uid
        };
        console.log('Task data to create:', taskData);
        
        const taskId = await FirebaseService.createTask(taskData);
        console.log('Task created with ID:', taskId);
        Alert.alert('Success', 'Task created successfully');
      }
      
      setModalVisible(false);
      // Clear form data
      setFormData({ description: '', duration: '', notes: '' });
      // Refresh tasks list
      await loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to save task: ${errorMessage}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteTask(taskId);
              Alert.alert('Success', 'Task deleted successfully');
              await loadTasks(); // Refresh the list
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskData['status']) => {
    try {
      await FirebaseService.updateTask(taskId, { status: newStatus });
      // Update local state immediately for better UX
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );
      // Then refresh to get the latest data
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const renderTaskItem = ({ item }: { item: TaskData & { id: string; creatorEmail?: string } }) => (
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
          <Text style={styles.taskLabel}>Created by:</Text>
          <Text style={styles.taskValue}>{item.creatorEmail || 'Unknown User'}</Text>
        </View>
        
        {item.notes && (
          <View style={styles.taskRow}>
            <Text style={styles.taskLabel}>Notes:</Text>
            <Text style={styles.taskValue}>{item.notes}</Text>
          </View>
        )}
        
        {/* Status Picker Row */}
        <View style={styles.taskRow}>
          <Text style={styles.taskLabel}>Status:</Text>
          <View style={styles.statusPickerContainer}>
            <Picker
              selectedValue={item.status}
              style={styles.statusPicker}
              onValueChange={(value) => handleStatusChange(item.id, value)}
              mode="dropdown"
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="In Progress" value="in_progress" />
              <Picker.Item label="Completed" value="completed" />
            </Picker>
          </View>
        </View>
      </View>
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditTask(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTask(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

  const getTotalDuration = (): number => {
    return tasks.reduce((total, task) => total + (task.duration || 0), 0);
  };

  const getCompletedTasks = (): number => {
    return tasks.filter(task => task.status === 'completed').length;
  };

  if (!project) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Project Info */}
        <View style={styles.projectCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectDescription}>{project.description}</Text>
          <View style={styles.projectMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.statusText}>{project.status}</Text>
            </View>
            <Text style={styles.projectDate}>
              Created: {project.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Task Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Task Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getCompletedTasks()}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatDuration(getTotalDuration())}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeader}>
            <Text style={styles.tasksTitle}>Tasks</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddTask}
            >
              <Text style={styles.addButtonText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tasks yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your first task to get started</Text>
            </View>
          ) : (
            <FlatList
              data={tasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Task Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />
            
            <TextInput
              style={styles.input}
              placeholder="Duration (in minutes)"
              value={formData.duration}
              onChangeText={(text) => setFormData({ ...formData, duration: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTask}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
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
  content: {
    flex: 1,
    padding: 20,
  },
  projectCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  projectDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  projectDate: {
    fontSize: 14,
    color: '#999',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tasksSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
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
  taskNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  taskCreator: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});
