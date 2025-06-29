import { createContext, useContext, useEffect, useState } from "react";
import { login, logout } from "../api/auth"; // API calls
import { getUserProfile } from "../api/reports"; // Import user profile API

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch complete user profile
  const fetchUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        const profileData = await getUserProfile();
        setUser(profileData);
        localStorage.setItem("user", JSON.stringify(profileData));
        return profileData;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // If profile fetch fails, try to use stored user data
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (parseError) {
          console.error("Error parsing stored user:", parseError);
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem("access_token");
      
      if (accessToken) {
        // Fetch fresh profile data from API
        await fetchUserProfile();
      } else {
        // No token, check for stored user data
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error("Error parsing stored user:", error);
            localStorage.removeItem("user");
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await login(credentials);
      
      if (response.requires_2fa) {
        return response; // Return for 2FA handling
      }
      
      if (response.user) {
        // Set basic user info from login response first
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Then fetch complete profile data
        try {
          await fetchUserProfile();
        } catch (profileError) {
          console.error("Error fetching complete profile after login:", profileError);
          // Continue with basic user info if profile fetch fails
        }
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      handleLogin, 
      handleLogout, 
      loading, 
      fetchUserProfile  // Export fetchUserProfile function
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
