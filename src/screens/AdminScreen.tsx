import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService, UserData } from "../services/firebaseService";

export default function AdminScreen({ navigation }: any) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<(UserData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadUsers();
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

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await FirebaseService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userData?.role === 'admin';

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await FirebaseService.updateUserRole(userId, newRole);
      Alert.alert('Success', 'User role updated successfully');
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully');
              loadUsers(); // Refresh the list
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserData & { id: string } }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#FF3B30' : '#007AFF' }]}>
          <Text style={styles.roleText}>{item.role || 'user'}</Text>
        </View>
      </View>
      
      <Text style={styles.userMeta}>
        Created: {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
      </Text>
      
      {item.id !== currentUser?.uid && (
        <View style={styles.adminActions}>
          <Button 
            title={item.role === 'admin' ? 'Remove Admin' : 'Make Admin'} 
            onPress={() => handleUpdateUserRole(item.id, item.role === 'admin' ? 'user' : 'admin')}
            color={item.role === 'admin' ? '#FF9500' : '#34C759'}
          />
          <View style={styles.buttonSpacer} />
          <Button 
            title="Delete" 
            onPress={() => handleDeleteUser(item.id)}
            color="#FF3B30"
          />
        </View>
      )}
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Denied</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Access Denied</Text>
          <Text style={styles.subtitle}>You need admin privileges to access this page.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
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
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadUsers}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>User Management</Text>

        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.usersList}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as menu button for centering
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  usersList: {
    paddingTop: 20,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  userMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonSpacer: {
    width: 12,
  },
});
