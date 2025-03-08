'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Define user type
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'staff';
  token: string;
}

// Define auth context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, name: string, role?: 'admin' | 'staff') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create auth provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Register user
  const register = async (email: string, password: string, name: string, role: 'admin' | 'staff' = 'staff') => {
    try {
      setError(null);
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with name
      await updateProfile(firebaseUser, { displayName: name });
      
      // Get ID token
      const token = await firebaseUser.getIdToken(true);
      
      // Simplified: Don't call backend for registration, just set local user state
      setCurrentUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
        role: 'admin', // Default to admin for first user for testing
        token,
      });
      
      console.log('User registered successfully:', { email, role: 'admin' });
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get ID token
      const token = await firebaseUser.getIdToken(true);
      
      // Simplified: Don't verify with backend, just set user state
      setCurrentUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: 'admin', // Default to admin for all users temporarily
        token,
      });
      
      console.log('User logged in successfully:', { email, role: 'admin' });
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token
          const token = await firebaseUser.getIdToken(true);
          
          // Simplified: Don't verify with backend, just set user state with admin role
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'admin', // Default to admin for all users temporarily
            token,
          });
          
        } catch (err) {
          console.error('Error fetching user data:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 