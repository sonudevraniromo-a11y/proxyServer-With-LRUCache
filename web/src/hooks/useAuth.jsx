import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginApi,
  logout as logoutApi,
  me,
} from "../services/authApi";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (!sessionStorage.getItem("relay_token")) {
      setChecking(false);
      return;
    }
    me()
      .then((data) => setUser(data.user))
      .catch(() => sessionStorage.clear())
      .finally(() => setChecking(false));
  }, []);
  async function login(identifier, password) {
    const data = await loginApi(identifier, password);
    sessionStorage.setItem("relay_token", data.token);
    setUser(data.user);
  }
  async function logout() {
    try {
      await logoutApi();
    } finally {
      sessionStorage.clear();
      setUser(null);
    }
  }
  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
