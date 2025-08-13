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
  orderBy,
  limit
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
        createdAt: Timestamp.fromDate(new Date())
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
          lastLogin: Timestamp.fromDate(new Date())
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

  // Check if a user is an admin
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(userId);
      return userData?.role === 'admin';
    } catch (error) {
      console.error("Error checking if user is admin:", error);
      return false;
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
      await setDoc(doc(db, "users", userId), { deleted: true, deletedAt: Timestamp.fromDate(new Date()) });
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
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
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
  static async initializeTasksCollection(): Promise<void> {
    try {
      console.log('Initializing tasks collection...');
      
      // Try to get one document to see if collection exists
      const tasksCollection = collection(db, "tasks");
      const sampleQuery = query(tasksCollection, limit(1));
      await getDocs(sampleQuery);
      
      console.log('Tasks collection already exists');
    } catch (error) {
      console.log('Tasks collection might not exist, creating sample task...');
      
      // Create a sample task to initialize the collection
      const tasksCollection = collection(db, "tasks");
      const sampleTask: TaskData = {
        description: "Sample Task",
        duration: 30,
        status: 'pending',
        projectId: "sample-project",
        createdBy: "system",
        createdAt: Timestamp.fromDate(new Date()),
        notes: "This is a sample task to initialize the collection"
      };
      
      try {
        await addDoc(tasksCollection, sampleTask);
        console.log('Tasks collection initialized with sample task');
        
        // Delete the sample task after a short delay
        setTimeout(async () => {
          try {
            const querySnapshot = await getDocs(query(tasksCollection, where("description", "==", "Sample Task")));
            querySnapshot.forEach(async (doc) => {
              await deleteDoc(doc.ref);
            });
            console.log('Sample task cleaned up');
          } catch (cleanupError) {
            console.log('Error cleaning up sample task:', cleanupError);
          }
        }, 5000);
      } catch (initError) {
        console.error('Error initializing tasks collection:', initError);
      }
    }
  }

  static async createTask(taskData: Omit<TaskData, 'createdAt'>, userId: string): Promise<string> {
    try {
      console.log('Creating task with data:', taskData);
      
      // Validate required fields
      if (!taskData.description || !taskData.duration || !taskData.projectId || !taskData.createdBy) {
        throw new Error('Missing required fields: description, duration, projectId, or createdBy');
      }
      
      // Security check: ensure the createdBy field matches the authenticated user
      if (taskData.createdBy !== userId) {
        throw new Error('You can only create tasks for yourself');
      }
      
      const taskWithTimestamp: TaskData = {
        ...taskData,
        createdAt: Timestamp.fromDate(new Date())
      };
      
      console.log('Task with timestamp:', taskWithTimestamp);
      
      // Create the tasks collection if it doesn't exist
      const tasksCollection = collection(db, "tasks");
      const docRef = await addDoc(tasksCollection, taskWithTimestamp);
      
      console.log('Task created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating task:", error);
      console.error("Task data that failed:", taskData);
      throw error;
    }
  }

  static async getProjectTasks(projectId: string, userId?: string): Promise<(TaskData & { id: string })[]> {
    try {
      let q;
      if (userId) {
        // Filter tasks by project and user
        q = query(
          collection(db, "tasks"), 
          where("projectId", "==", projectId),
          where("createdBy", "==", userId)
        );
      } else {
        // Get all tasks for the project (for admin users)
        q = query(
          collection(db, "tasks"), 
          where("projectId", "==", projectId)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const tasks: (TaskData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        } as TaskData & { id: string });
      });
      
      // Sort by creation date (newest first) in JavaScript
      return tasks.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    } catch (error) {
      console.error("Error getting project tasks:", error);
      throw error;
    }
  }

  // Get tasks created by a specific user for a project
  static async getUserProjectTasks(projectId: string, userId: string): Promise<(TaskData & { id: string })[]> {
    try {
      const q = query(
        collection(db, "tasks"), 
        where("projectId", "==", projectId),
        where("createdBy", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const tasks: (TaskData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        } as TaskData & { id: string });
      });
      
      // Sort by creation date (newest first) in JavaScript
      return tasks.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    } catch (error) {
      console.error("Error getting user project tasks:", error);
      throw error;
    }
  }

  static async updateTask(taskId: string, data: Partial<TaskData>, userId?: string): Promise<void> {
    try {
      // If userId is provided, check if the user can update this task
      if (userId) {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));
        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }
        
        const taskData = taskDoc.data() as TaskData;
        
        // Check if user is admin (you might want to implement a proper admin check)
        // For now, we'll rely on the client-side check
        if (taskData.createdBy !== userId) {
          throw new Error('You can only update tasks you created');
        }
      }
      
      const updateData = { ...data };
      
      // If marking as completed, add completion timestamp
      if (data.status === 'completed' && !data.completedAt) {
        updateData.completedAt = Timestamp.fromDate(new Date());
      }
      
      await updateDoc(doc(db, "tasks", taskId), updateData);
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  static async deleteTask(taskId: string, userId?: string): Promise<void> {
    try {
      // If userId is provided, check if the user can delete this task
      if (userId) {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));
        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }
        
        const taskData = taskDoc.data() as TaskData;
        
        // Check if user is admin (you might want to implement a proper admin check)
        // For now, we'll rely on the client-side check
        if (taskData.createdBy !== userId) {
          throw new Error('You can only delete tasks you created');
        }
      }
      
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

  // Get tasks with user information
  static async getProjectTasksWithUsers(projectId: string, userId?: string): Promise<(TaskData & { id: string; creatorEmail?: string })[]> {
    try {
      const tasks = await this.getProjectTasks(projectId, userId);
      
      // Get user emails for each task
      const tasksWithUsers = await Promise.all(
        tasks.map(async (task) => {
          try {
            const userData = await this.getUserData(task.createdBy);
            return {
              ...task,
              creatorEmail: userData?.email || 'Unknown User'
            };
          } catch (error) {
            console.error(`Error getting user data for ${task.createdBy}:`, error);
            return {
              ...task,
              creatorEmail: 'Unknown User'
            };
          }
        })
      );
      
      return tasksWithUsers;
    } catch (error) {
      console.error("Error getting project tasks with users:", error);
      throw error;
    }
  }

  // Get tasks created by a specific user with user information
  static async getUserProjectTasksWithUsers(projectId: string, userId: string): Promise<(TaskData & { id: string; creatorEmail?: string })[]> {
    try {
      const tasks = await this.getUserProjectTasks(projectId, userId);
      
      // Get user emails for each task
      const tasksWithUsers = await Promise.all(
        tasks.map(async (task) => {
          try {
            const userData = await this.getUserData(task.createdBy);
            return {
              ...task,
              creatorEmail: userData?.email || 'Unknown User'
            };
          } catch (error) {
            console.error(`Error getting user data for ${task.createdBy}:`, error);
            return {
              ...task,
              creatorEmail: 'Unknown User'
            };
          }
        })
      );
      
      return tasksWithUsers;
    } catch (error) {
      console.error("Error getting user project tasks with users:", error);
      throw error;
    }
  }

  // Get all tasks with user information (for admin users)
  static async getAllTasksWithUsers(): Promise<(TaskData & { id: string; creatorEmail?: string })[]> {
    try {
      const tasks = await this.getAllTasks();
      
      // Get user emails for each task
      const tasksWithUsers = await Promise.all(
        tasks.map(async (task) => {
          try {
            const userData = await this.getUserData(task.createdBy);
            return {
              ...task,
              creatorEmail: userData?.email || 'Unknown User'
            };
          } catch (error) {
            console.error(`Error getting user data for ${task.createdBy}:`, error);
            return {
              ...task,
              creatorEmail: 'Unknown User'
            };
          }
        })
      );
      
      return tasksWithUsers;
    } catch (error) {
      console.error("Error getting all tasks with users:", error);
      throw error;
    }
  }

  // Check if a user can access a project
  static async canUserAccessProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(userId);
      if (userData?.role === 'admin') {
        return true; // Admins can access all projects
      }
      
      const projectData = await this.getProject(projectId);
      if (!projectData) {
        return false; // Project doesn't exist
      }
      
      // Users can access projects they created
      return projectData.createdBy === userId;
    } catch (error) {
      console.error("Error checking project access:", error);
      return false;
    }
  }
}

