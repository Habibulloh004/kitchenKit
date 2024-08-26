import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      setUser(true);
    }
  }, []);

  const login = (token) => {
    Cookies.set("authToken", token, { expires: 1 });
    setUser(true);
  };

  const logout = () => {
    Cookies.remove("authToken");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
