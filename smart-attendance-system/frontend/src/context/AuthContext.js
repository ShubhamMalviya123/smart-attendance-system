import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");
    return role ? { role, email, name } : null;
  });

  const login = (loginResponse) => {
    localStorage.setItem("token", loginResponse.token);
    localStorage.setItem("role", loginResponse.role);
    localStorage.setItem("email", loginResponse.email);
    localStorage.setItem("name", loginResponse.name);
    setUser({ role: loginResponse.role, email: loginResponse.email, name: loginResponse.name });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
