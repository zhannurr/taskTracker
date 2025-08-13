import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Text } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import ProjectsScreen from "../screens/ProjectsScreen";
import TasksScreen from "../screens/TasksScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AdminScreen from "../screens/AdminScreen";
import CustomDrawerContent from "./CustomDrawerContent";

export type DrawerParamList = {
  Projects: undefined;
  Profile: undefined;
  Admin: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  const { currentUser } = useAuth();

  return (
    <Drawer.Navigator
      initialRouteName="Projects"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#666',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
      }}
    >
      <Drawer.Screen 
        name="Projects" 
        component={ProjectsScreen}
        options={{
          drawerLabel: "Projects",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
        }}
      />
      
      
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: "Profile",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
      
      {currentUser && (
        <Drawer.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{
            drawerLabel: "Admin Panel",
            drawerIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>⚙️</Text>
            ),
          }}
        />
      )}
    </Drawer.Navigator>
  );
}
