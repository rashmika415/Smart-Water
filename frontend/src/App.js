import './App.css';
import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminRoute } from "./components/admin/AdminRoute";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ManageUsers } from "./pages/admin/ManageUsers";
import { ManageHouseholds } from "./pages/admin/ManageHouseholds";
import { AllHouseholdsWithZones } from "./pages/admin/AllHouseholdsWithZones";
import { useAuth } from "./auth/AuthContext";

function App() {
  const { token } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={token ? <DashboardPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="households" element={<ManageHouseholds />} />
          <Route path="households-zones" element={<AllHouseholdsWithZones />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
