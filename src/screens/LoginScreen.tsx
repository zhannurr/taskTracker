import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../navigation/types";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation will be handled automatically by the auth state change
    } catch (error: any) {
      let errorMessage = "Login failed";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "User not found";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Wrong password";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        editable={!loading}
      />
      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={styles.loader} />}
      <Button
        title="Go to Register"
        onPress={() => navigation.navigate("Register")}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  loader: {
    marginTop: 10,
  },
});
