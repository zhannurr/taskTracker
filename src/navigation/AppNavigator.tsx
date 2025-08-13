import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DrawerNavigator from "./DrawerNavigator";
import ProjectDetailScreen from "../screens/ProjectDetailScreen";
import { RootStackParamList } from "./types";
import { useAuth } from "../contexts/AuthContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { currentUser } = useAuth();

  return (
    <Stack.Navigator initialRouteName={currentUser ? "MainApp" : "Login"}>
      {currentUser ? (
        // Authenticated user - show drawer navigation
        <>
          <Stack.Screen 
            name="MainApp" 
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ProjectDetail" 
            component={ProjectDetailScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Not authenticated - show Login and Register screens
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
