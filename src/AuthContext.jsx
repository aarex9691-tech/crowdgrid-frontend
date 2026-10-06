import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Combine decoded JWT data with the role (if it wasn't inside the JWT)
        setUser({ ...decoded, role: decoded.role || storedRole || 'Attendee' });
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, role) => {
    localStorage.setItem('token', token);
    if (role) localStorage.setItem('role', role);

    const decoded = jwtDecode(token);
    setUser({ ...decoded, role: decoded.role || role || 'Attendee' });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};