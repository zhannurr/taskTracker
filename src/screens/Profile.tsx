import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../navigation/types";

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "MainApp">;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by the auth state change
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {currentUser?.email || "Guest"}!</Text>
      <Text style={styles.subtitle}>You are successfully logged in</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 20 },
  subtitle: { fontSize: 16, marginBottom: 30, color: '#666' },
});
