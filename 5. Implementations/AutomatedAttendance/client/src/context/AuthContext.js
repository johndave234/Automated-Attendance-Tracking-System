import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userType: null, // 'admin', 'student', or 'instructor'
    userData: null,
  });

  const login = (userType, userData) => {
    setAuthState({
      isLoggedIn: true,
      userType,
      userData,
    });
    
    // For backward compatibility
    if (userType === 'admin') {
      setIsAdminLoggedIn(true);
    }
  };

  const logout = () => {
    setAuthState({
      isLoggedIn: false,
      userType: null,
      userData: null,
    });
    
    // For backward compatibility
    setIsAdminLoggedIn(false);
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