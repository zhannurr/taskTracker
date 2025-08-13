import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService, UserData } from "../services/firebaseService";

export default function ProfileScreen({ navigation }: any) {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      if (currentUser) {
        const data = await FirebaseService.getUserData(currentUser.uid);
        setUserData(data);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load user data");
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



  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{currentUser?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{currentUser?.uid}</Text>
        </View>
        {userData && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Created:</Text>
              <Text style={styles.value}>
                {userData.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Login:</Text>
              <Text style={styles.value}>
                {userData.lastLogin?.toDate?.()?.toLocaleDateString() || "N/A"}
              </Text>
            </View>
            {userData.role && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Role:</Text>
                <Text style={[styles.value, styles.roleText]}>{userData.role}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {userData?.role === "admin" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Admin")}
          >
            <Text style={styles.buttonText}>Admin Panel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  section: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  roleText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
