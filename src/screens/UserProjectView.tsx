import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService, ProjectData, TaskData } from "../services/firebaseService";
import { useFocusEffect } from '@react-navigation/native';
import ProjectDetails from "../components/ProjectDetails";
import TaskList from "../components/TaskList";
import TaskModal from "../components/TaskModal";

interface UserProjectViewProps {
  route: any;
  navigation: any;
}

export default function UserProjectView({ route, navigation }: UserProjectViewProps) {
  const { currentUser } = useAuth();
  const { projectId } = route.params;
  
  const [project, setProject] = useState<(ProjectData & { id: string }) | null>(null);
  const [tasks, setTasks] = useState<(TaskData & { id: string; creatorEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<(TaskData & { id: string }) | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    duration: '',
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadTasks();
      FirebaseService.initializeTasksCollection().catch(error => {
        console.log('Error initializing tasks collection:', error);
      });
    }
  }, [projectId, currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      if (projectId) {
        loadTasks();
      }
    }, [projectId])
  );

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
      console.log('=== Starting loadTasks for User ===');
      console.log('Current user:', currentUser?.uid);
      console.log('Project ID:', projectId);
      
      if (!currentUser?.uid) {
        console.log('No current user, cannot load tasks');
        return;
      }
      
      const tasksData = await FirebaseService.getUserProjectTasksWithUsers(projectId, currentUser.uid);
      console.log('User tasks loaded successfully:', tasksData.length);
      
      setTasks(tasksData);
    } catch (error) {
      console.error('Error in loadTasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to load tasks: ${errorMessage}`);
    } finally {
      setLoading(false);
      console.log('=== loadTasks completed ===');
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setFormData({ 
      description: '', 
      duration: '',
    });
    setModalVisible(true);
  };

  const handleEditTask = (task: TaskData & { id: string }) => {
    // Security check: only allow editing if user created the task
    if (task.createdBy !== currentUser?.uid) {
      Alert.alert('Error', 'You can only edit tasks you created');
      return;
    }
    
    setEditingTask(task);
    setFormData({
      description: task.description,
      duration: task.duration.toString(),
    });
    setModalVisible(true);
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!projectId || !currentUser?.uid) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    try {
      if (editingTask) {
        console.log('Updating existing task:', editingTask.id);
        await FirebaseService.updateTask(editingTask.id, {
          description: formData.description.trim(),
          duration,
        }, currentUser.uid);
        Alert.alert('Success', 'Task updated successfully');
      } else {
        console.log('Creating new task');
        
        const taskData = {
          description: formData.description.trim(),
          duration,
          status: 'pending' as const,
          projectId,
          createdBy: currentUser.uid,
        };
        console.log('Task data to create:', taskData);
        
        const taskId = await FirebaseService.createTask(taskData, currentUser.uid);
        console.log('Task created with ID:', taskId);
        Alert.alert('Success', 'Task created successfully');
      }
      
      setModalVisible(false);
      setFormData({ description: '', duration: '' });
      await loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to save task: ${errorMessage}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Find the task to check permissions
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      Alert.alert('Error', 'Task not found');
      return;
    }
    
    // Security check: only allow deletion if user created the task
    if (task.createdBy !== currentUser?.uid) {
      Alert.alert('Error', 'You can only delete tasks you created');
      return;
    }
    
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
              await FirebaseService.deleteTask(taskId, currentUser?.uid);
              Alert.alert('Success', 'Task deleted successfully');
              await loadTasks();
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
    // Find the task to check permissions
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      Alert.alert('Error', 'Task not found');
      return;
    }
    
    // Security check: only allow status changes if user created the task
    if (task.createdBy !== currentUser?.uid) {
      Alert.alert('Error', 'You can only change the status of tasks you created');
      return;
    }
    
    try {
      await FirebaseService.updateTask(taskId, { status: newStatus }, currentUser?.uid);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
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
    <ProjectDetails
      project={project}
      headerTitle="Project Details"
      statsTitle="Your Task Overview"
      tasksTitle="Your Tasks"
      tasksInfoText="You can only see and manage your own tasks"
      onBackPress={() => navigation.goBack()}
      tasks={tasks}
    >
      <View style={styles.tasksHeader}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddTask}
        >
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      <TaskList
        tasks={tasks}
        loading={loading}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onStatusChange={handleStatusChange}
        currentUserId={currentUser?.uid}
        showEditDelete={true}
        showAssignmentInfo={true}
      />

      <TaskModal
        visible={modalVisible}
        editingTask={editingTask}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSave={handleSaveTask}
        onClose={() => setModalVisible(false)}
      />
    </ProjectDetails>
  );
}

const styles = StyleSheet.create({
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
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
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
});