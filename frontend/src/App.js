import './App.css';
import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VirtualMeterPage } from "./pages/VirtualMeterPage";
import { ContactPage } from "./pages/ContactPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminRoute } from "./components/admin/AdminRoute";
import { UserLayout } from "./components/user/UserLayout";
import { UserRoute } from "./components/user/UserRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { ManageUsers } from "./pages/admin/ManageUsers";
import { ManageHouseholds } from "./pages/admin/ManageHouseholds";
import { AllHouseholdsWithZones } from "./pages/admin/AllHouseholdsWithZones";
import { ManageActivities } from "./pages/admin/ManageActivities";
import { ManageUsage } from "./pages/admin/ManageUsage";
import { SavingPlaneA } from "./pages/admin/SavingPlaneA";
import { UserDashboard } from "./pages/user/UserDashboard";
import { MyProfile } from "./pages/user/MyProfile";
import { MyHouseholds } from "./pages/user/MyHouseholds";
import { HouseholdDetails } from "./pages/user/HouseholdDetails";
import { EstimatedBill } from "./pages/user/EstimatedBill";
import { WeatherInsights } from "./pages/user/WeatherInsights";
import { SavingPlane } from "./pages/user/SavingPlane";
import { ViewSavingPlane } from "./pages/user/ViewSavingPlane";
import { UserActivities } from "./pages/user/UserActivities";

import { UsageHistory } from "./pages/user/UsageHistory";
import { WaterActivities } from "./pages/user/WaterActivities";
import { CarbonAnalytics } from "./pages/user/CarbonAnalytics";
import { useAuth } from "./auth/AuthContext";

function App() {
  const { token, user } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/virtual-meter" element={<VirtualMeterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            token
              ? user?.role === "admin"
                ? <Navigate to="/admin" replace />
                : <Navigate to="/user" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="/legacy-dashboard" element={<Navigate to="/user" replace />} />
        <Route
          path="/user"
          element={
            <UserRoute>
              <UserLayout />
            </UserRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="water-activities" element={<WaterActivities />} />
          <Route path="usage" element={<UsageHistory />} />
          <Route path="carbon-analytics" element={<CarbonAnalytics />} />
          <Route path="households" element={<MyHouseholds />} />
          <Route path="households/:id" element={<HouseholdDetails />} />
          <Route path="estimated-bill" element={<EstimatedBill />} />
          <Route path="saving-plane" element={<SavingPlane />} />
          <Route path="saving-plane/update/:planId" element={<SavingPlane />} />
          <Route path="view-saving-plane" element={<ViewSavingPlane />} />
          <Route path="weather-insights" element={<WeatherInsights />} />
          <Route path="activities" element={<UserActivities />} />
        </Route>
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
          <Route path="activities" element={<ManageActivities />} />
          <Route path="usage" element={<ManageUsage />} />
          <Route path="saving-plans" element={<SavingPlaneA />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}


export default App;
