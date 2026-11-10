import React, { createContext, useContext, useMemo } from 'react';
import { getAccessToken } from '../lib/api';
import { InstitutionalRole, UserProfile } from '../types';
import { useApp } from './AppContext';

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  role: 'student' | 'faculty_advisor';
  rollNumber?: string;
  batchYear?: number;
  currentSemester?: number;
  cgpa?: number;
  coreGrades?: Record<string, number>;
  skills?: string[];
  areasOfInterest?: string[];
  targetRoles?: string[];
  bio?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  primarySpecializationBasket?: string;
  assignedBasketId?: number;
  assignedBasketName?: string;
  officeRoom?: string;
  specializationArea?: string;
}

export interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (
    identifier: string,
    password: string,
    expectedRole?: 'student' | 'faculty_advisor'
  ) => Promise<{ success: boolean; role?: InstitutionalRole; user?: UserProfile; error?: string }>;
  signup: (
    formData: SignupFormData
  ) => Promise<{ success: boolean; role?: InstitutionalRole; user?: UserProfile; error?: string }>;
  logout: () => void;
  updateProfile: (
    updates: Partial<UserProfile> & { coreGrades?: Record<string, number> }
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    isAuthenticated,
    isAuthHydrating,
    loginWithCredentials,
    registerNewUser,
    logoutUser,
    updateCurrentUserProfile,
  } = useApp();

  const token = useMemo(() => {
    if (!isAuthenticated) return null;
    return getAccessToken();
  }, [isAuthenticated, currentUser]);

  const user = isAuthenticated ? currentUser : null;

  const value: AuthContextValue = {
    user,
    token,
    isLoading: isAuthHydrating,
    login: loginWithCredentials,
    signup: registerNewUser,
    logout: logoutUser,
    updateProfile: updateCurrentUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
