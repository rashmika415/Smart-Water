import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, usersApi } from "../lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "smartwater.token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  const refreshMe = useCallback(async (tkn) => {
    if (!tkn) return null;
    try {
      const me = await usersApi.me(tkn);
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    const nextToken = res?.token;
    if (!nextToken) throw new Error("Login succeeded but no token returned");
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    await refreshMe(nextToken);
    return nextToken;
  }, [refreshMe]);

  const register = useCallback(async ({ name, email, password, role }) => {
    return authApi.register({ name, email, password, role });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await refreshMe(token);
      if (!cancelled) setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, refreshMe]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshMe,
      setToken,
    }),
    [token, user, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

