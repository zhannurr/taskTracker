import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  UserCredential,
  User 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  Timestamp,
  deleteDoc,
  orderBy
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export interface UserData {
  email: string;
  password: string;
  role?: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

export interface ProjectData {
  title: string;
  description: string;
  status: 'active' | 'completed' | 'pending';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface TaskData {
  description: string;
  duration: number; // in minutes
  status: 'pending' | 'in_progress' | 'completed';
  projectId: string;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  notes?: string;
}

export class FirebaseService {
  // User Authentication
  static async registerUser(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Check if this is the first user (make them admin)
      const usersQuery = await getDocs(collection(db, "users"));
      const isFirstUser = usersQuery.empty;
      
      // Store additional user data in Firestore
      const userData: UserData = {
        email,
        password, // Note: In production, you might want to store additional user info instead of password
        role: isFirstUser ? "admin" : "user", // First user becomes admin
        createdAt: new Timestamp(new Date().getTime() / 1000, 0)
      };
      
      await setDoc(doc(db, "users", userCredential.user.uid), userData);
      
      return userCredential;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  static async loginUser(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      if (userCredential.user) {
        await updateDoc(doc(db, "users", userCredential.user.uid), {
          lastLogin: new Timestamp(new Date().getTime() / 1000, 0) // Convert Date to Timestamp
        });
      }
      
      return userCredential;
    } catch (error) {
      console.error("Error logging in user:", error);
      throw error;
    }
  }

  static async logoutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out user:", error);
      throw error;
    }
  }

  // User Data Management
  static async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  static async updateUserData(userId: string, data: Partial<UserData>): Promise<void> {
    try {
      await updateDoc(doc(db, "users", userId), data);
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  }

  // Get current authenticated user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }

  // Admin methods
  static async getAllUsers(): Promise<(UserData & { id: string })[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users: (UserData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        } as UserData & { id: string });
      });
      
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  static async updateUserRole(userId: string, role: string): Promise<void> {
    try {
      await updateDoc(doc(db, "users", userId), { role });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      // Note: In a real app, you might want to also delete the user's auth account
      // This requires Cloud Functions or admin SDK
      await setDoc(doc(db, "users", userId), { deleted: true, deletedAt: new Timestamp(new Date().getTime() / 1000, 0) });
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Project Management Methods
  static async createProject(projectData: Omit<ProjectData, 'createdAt'>): Promise<string> {
    try {
      const projectWithTimestamp: ProjectData = {
        ...projectData,
        createdAt: new Timestamp(new Date().getTime() / 1000, 0),
        updatedAt: new Timestamp(new Date().getTime() / 1000, 0)
      };
      
      const docRef = await addDoc(collection(db, "projects"), projectWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  static async getAllProjects(): Promise<(ProjectData & { id: string })[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projects: (ProjectData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        } as ProjectData & { id: string });
      });
      
      // Sort by creation date (newest first)
      return projects.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  }

  static async getProject(projectId: string): Promise<(ProjectData & { id: string }) | null> {
    try {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        return {
          id: projectDoc.id,
          ...projectDoc.data()
        } as ProjectData & { id: string };
      }
      return null;
    } catch (error) {
      console.error("Error getting project:", error);
      throw error;
    }
  }

  static async updateProject(projectId: string, data: Partial<ProjectData>): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Timestamp(new Date().getTime() / 1000, 0)
      };
      
      await updateDoc(doc(db, "projects", projectId), updateData);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "projects", projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  // Task Management Methods
  static async createTask(taskData: Omit<TaskData, 'createdAt'>): Promise<string> {
    try {
      const taskWithTimestamp: TaskData = {
        ...taskData,
        createdAt: new Timestamp(new Date().getTime() / 1000, 0)
      };
      
      const docRef = await addDoc(collection(db, "tasks"), taskWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  static async getProjectTasks(projectId: string): Promise<(TaskData & { id: string })[]> {
    try {
      const q = query(
        collection(db, "tasks"), 
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const tasks: (TaskData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        } as TaskData & { id: string });
      });
      
      return tasks;
    } catch (error) {
      console.error("Error getting project tasks:", error);
      throw error;
    }
  }

  static async updateTask(taskId: string, data: Partial<TaskData>): Promise<void> {
    try {
      const updateData = { ...data };
      
      // If marking as completed, add completion timestamp
      if (data.status === 'completed' && !data.completedAt) {
        updateData.completedAt = new Timestamp(new Date().getTime() / 1000, 0);
      }
      
      await updateDoc(doc(db, "tasks", taskId), updateData);
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  static async getAllTasks(): Promise<(TaskData & { id: string })[]> {
    try {
      const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const tasks: (TaskData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        } as TaskData & { id: string });
      });
      
      return tasks;
    } catch (error) {
      console.error("Error getting all tasks:", error);
      throw error;
    }
  }
}

