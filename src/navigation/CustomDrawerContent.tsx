import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService, UserData } from "../services/firebaseService";
import { useState, useEffect } from "react";

interface CustomDrawerContentProps {
  navigation: any;
  state: any;
}

export default function CustomDrawerContent({ navigation, state }: CustomDrawerContentProps) {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
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

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const isAdmin = userData?.role === 'admin';

  return (
    <View style={styles.container}>
      <DrawerContentScrollView>
        {/* User Header */}
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.email?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={styles.userEmail}>{currentUser?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: isAdmin ? '#FF3B30' : '#007AFF' }]}>
            <Text style={styles.roleText}>{userData?.role || 'user'}</Text>
          </View>
        </View>

        {/* Navigation Items */}
        <View style={styles.drawerSection}>
          <TouchableOpacity
            style={[
              styles.drawerItem,
              state.index === 0 && styles.activeDrawerItem
            ]}
            onPress={() => navigation.navigate("Projects")}
          >
            <Text style={styles.drawerIcon}>📋</Text>
            <Text style={[
              styles.drawerLabel,
              state.index === 0 && styles.activeDrawerLabel
            ]}>
              Projects
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.drawerItem,
              state.index === 2 && styles.activeDrawerItem
            ]}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.drawerIcon}>👤</Text>
            <Text style={[
              styles.drawerLabel,
              state.index === 2 && styles.activeDrawerLabel
            ]}>
              Profile
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={[
                styles.drawerItem,
                state.index === 3 && styles.activeDrawerItem
              ]}
              onPress={() => navigation.navigate("Admin")}
            >
              <Text style={styles.drawerIcon}>⚙️</Text>
              <Text style={[
                styles.drawerLabel,
                state.index === 3 && styles.activeDrawerLabel
              ]}>
                Admin Panel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  drawerSection: {
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeDrawerItem: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  drawerIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 30,
    textAlign: 'center',
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeDrawerLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

