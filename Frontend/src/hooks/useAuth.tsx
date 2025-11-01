import { useState, useEffect } from "react";
import apiClient from "@/integrations/api/client";

interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  preferences?: string[];
  newsletterSubscription?: boolean;
  newsletterTime?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user data
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const { user: userData } = response.data;
      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // If token is invalid, clear storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const updateUser = (newUserData: User) => {
    setUser(newUserData);
    localStorage.setItem('userData', JSON.stringify(newUserData));
  };

  return { user, loading, signIn, signUp, signOut, updateUser, fetchUser };
};
