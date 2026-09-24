// import React, { createContext, useState } from 'react';

// interface AuthContextType {
//   token: string | null;
//   user: any | null;
//   loginUser: (token: string, user: any) => void;
//   logoutUser: () => void;
// }

// export const AuthContext = createContext<AuthContextType | null>(null);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
//   const [user, setUser] = useState<any | null>(JSON.parse(localStorage.getItem('user') || 'null'));

//   const loginUser = (userToken: string, userData: any) => {
//     setToken(userToken);
//     setUser(userData);
//     localStorage.setItem('token', userToken);
//     localStorage.setItem('user', JSON.stringify(userData));
//   };

//   const logoutUser = () => {
//     setToken(null);
//     setUser(null);
//     localStorage.clear();
//   };

//   return (
//     <AuthContext.Provider value={{ token, user, loginUser, logoutUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useState } from "react";

interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: "SuperAdmin" | "SalonAdmin" | "Staff" | "Customer";
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  loginUser: (token: string, user: AuthUser) => void;
  logoutUser: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const loginUser = (userToken: string, userData: AuthUser) => {
    setToken(userToken);
    setUser(userData);

    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

