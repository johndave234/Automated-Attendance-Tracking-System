import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userType: null, // 'admin', 'student', or 'instructor'
    userData: null,
  });
  const [user, setUser] = useState(null);

  // Load auth state from storage on initial mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedAuthState = await AsyncStorage.getItem('authState');
        const storedUser = await AsyncStorage.getItem('userData');
        
        if (storedAuthState) {
          const parsedAuthState = JSON.parse(storedAuthState);
          setAuthState(parsedAuthState);
          
          // For backward compatibility
          if (parsedAuthState.userType === 'admin') {
            setIsAdminLoggedIn(true);
          }
        }
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('Loaded user from storage:', parsedUser);
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      }
    };
    
    loadAuthState();
  }, []);

  const login = async (userType, userData) => {
    console.log('Login called with:', { userType, userData });
    
    const newAuthState = {
      isLoggedIn: true,
      userType,
      userData,
    };
    
    setAuthState(newAuthState);
    setUser(userData);
    
    // For backward compatibility
    if (userType === 'admin') {
      setIsAdminLoggedIn(true);
    }
    
    // Store in AsyncStorage
    try {
      await AsyncStorage.setItem('authState', JSON.stringify(newAuthState));
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store auth state:', error);
    }
  };

  const logout = async () => {
    setAuthState({
      isLoggedIn: false,
      userType: null,
      userData: null,
    });
    setUser(null);
    
    // For backward compatibility
    setIsAdminLoggedIn(false);
    
    // Clear from AsyncStorage
    try {
      await AsyncStorage.removeItem('authState');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  };

  // For backward compatibility
  const loginAdmin = () => {
    login('admin', { id: 'admin' });
  };

  const logoutAdmin = () => {
    logout();
  };

  return (
    <AuthContext.Provider 
      value={{ 
        ...authState, 
        isAdminLoggedIn,
        user,
        login, 
        logout,
        loginAdmin,
        logoutAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 