// frontend/src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import CoursesPage from "./pages/CoursesPage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import SupervisorTeamsDashboard from "./pages/SupervisorTeamsDashboard";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-register" element={<AdminRegisterPage />} />

        {/* Protected admin routes remain the same */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<UsersPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/submissions" element={<SubmissionsPage></SubmissionsPage>} />
            <Route path="/supervisor-teams" element={<SupervisorTeamsDashboard></SupervisorTeamsDashboard>} />

          </Route>
        </Route>
      </Routes>

    </Router>
  );
}

export default App;
