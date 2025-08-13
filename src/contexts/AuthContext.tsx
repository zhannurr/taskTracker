import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { FirebaseService } from '../services/firebaseService';


interface AuthContextType {
  currentUser: User | null;

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

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await FirebaseService.loginUser(email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await FirebaseService.registerUser(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await FirebaseService.logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
      
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
