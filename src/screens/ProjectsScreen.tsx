import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService, UserData } from "../services/firebaseService";

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'pending';
  createdAt: any;
  createdBy: string;
}

export default function ProjectsScreen({ navigation }: any) {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active' as 'active' | 'completed' | 'pending'
  });

  useEffect(() => {
    loadProjects();
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

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

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await FirebaseService.getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userData?.role === 'admin';

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormData({ title: '', description: '', status: 'active' });
    setModalVisible(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      status: project.status
    });
    setModalVisible(true);
  };

  const handleSaveProject = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      if (editingProject) {
        await FirebaseService.updateProject(editingProject.id, formData);
        Alert.alert('Success', 'Project updated successfully');
      } else {
        await FirebaseService.createProject({
          ...formData,
          createdBy: currentUser?.uid || ''
        });
        Alert.alert('Success', 'Project created successfully');
      }
      
      setModalVisible(false);
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Error', 'Failed to save project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteProject(projectId);
              Alert.alert('Success', 'Project deleted successfully');
              loadProjects();
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          }
        }
      ]
    );
  };

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const renderProjectItem = ({ item }: { item: Project }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.projectDescription}>{item.description}</Text>
      <Text style={styles.projectMeta}>
        Created: {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
      </Text>
      
      <View style={styles.projectActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addTaskButton]}
          onPress={(e) => {
            e.stopPropagation();
            navigation.navigate('ProjectDetail', { projectId: item.id });
          }}
        >
          <Text style={styles.actionButtonText}>+ Task</Text>
        </TouchableOpacity>
        
        {isAdmin && (
          <>
            <View style={styles.buttonSpacer} />
            
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleEditProject(item);
              }}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <View style={styles.buttonSpacer} />
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteProject(item.id);
              }}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'completed': return '#007AFF';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading projects...</Text>
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
        <Text style={styles.title}>Projects</Text>
        {isAdmin && (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateProject}
          >
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={projects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.projectsList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProject ? 'Edit Project' : 'Create Project'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Project Title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Project Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonRow}>
              <Button 
                title="Cancel" 
                onPress={() => setModalVisible(false)}
                color="#8E8E93"
              />
              <View style={styles.buttonSpacer} />
              <Button 
                title="Save" 
                onPress={handleSaveProject}
                color="#007AFF"
              />
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
    paddingTop: 50, // Add top padding for status bar
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  projectsList: {
    padding: 20,
  },
  projectCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  projectDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  projectMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  projectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  addTaskButton: {
    backgroundColor: '#4CAF50', // A different color for the add task button
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonSpacer: {
    width: 12,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
