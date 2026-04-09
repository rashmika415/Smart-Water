import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function UserRoute({ children }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || !user || user.role !== "user") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
