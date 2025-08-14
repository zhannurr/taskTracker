import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from 'firebase/auth';
import { FirebaseService, UserData } from '../services/firebaseService';


interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isAdmin: boolean;
  refreshUserData: () => Promise<void>;


  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshUserData = useCallback(async () => {
    if (currentUser) {
      try {
        console.log('=== refreshUserData called ===');
        console.log('Current user UID:', currentUser.uid);
        console.log('Current user email:', currentUser.email);
        
        const data = await FirebaseService.getUserData(currentUser.uid);
        console.log('User data loaded from Firestore:', data);
        
        if (data) {
          console.log('User role from data:', data.role);
          console.log('Setting userData to:', data);
          setUserData(data);
          
          const adminStatus = data.role === 'admin';
          console.log('Setting admin status to:', adminStatus);
          setIsAdmin(adminStatus);
        } else {
          console.log('No user data found in Firestore');
          setUserData(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        setUserData(null);
        setIsAdmin(false);
      }
    } else {
      console.log('No current user in refreshUserData');
    }
  }, [currentUser]);

 

  // Check initial auth state immediately
  useEffect(() => {
    console.log('AuthContext: Checking initial auth state');
    const currentAuthUser = FirebaseService.getCurrentUser();
    if (currentAuthUser) {
      console.log('AuthContext: Found existing auth user:', currentAuthUser.uid);
      setCurrentUser(currentAuthUser);
      // Load user data immediately for existing auth state
      refreshUserData();
    }
  }, [refreshUserData]);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    const unsubscribe = FirebaseService.onAuthStateChanged(async (user) => {
      console.log('AuthContext: Auth state changed:', user?.uid);
      setCurrentUser(user);
      if (user) {
        // Load user data when auth state changes
        console.log('AuthContext: User logged in, loading user data');
        try {
          await refreshUserData();
          console.log('AuthContext: User data loaded successfully');
        } catch (error) {
          console.error('AuthContext: Error loading user data:', error);
        }
      } else {
        // Clear user data when logged out
        console.log('AuthContext: User logged out, clearing data');
        setUserData(null);
        setIsAdmin(false);
      }
    });

    return unsubscribe;
  }, [refreshUserData]);

  const login = async (email: string, password: string) => {
    try {
      await FirebaseService.loginUser(email, password);
      // User data will be loaded automatically by the auth state change listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await FirebaseService.registerUser(email, password);
      // User data will be loaded automatically by the auth state change listener
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await FirebaseService.logoutUser();
      // User data will be cleared automatically by the auth state change listener
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    isAdmin,
    refreshUserData,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
