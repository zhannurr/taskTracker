import React from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminProjectView from "./AdminProjectView";
import UserProjectView from "./UserProjectView";

interface ProjectDetailScreenProps {
  route: any;
  navigation: any;
}

export default function ProjectDetailScreen({ route, navigation }: ProjectDetailScreenProps) {
  const { isAdmin } = useAuth();
  const { projectId } = route.params;

  // Render appropriate component based on user role
  if (isAdmin) {
    return <AdminProjectView route={route} navigation={navigation} />;
  } else {
    return <UserProjectView route={route} navigation={navigation} />;
  }
}