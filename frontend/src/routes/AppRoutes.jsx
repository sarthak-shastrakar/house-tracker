import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/MainLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ProjectsList from '../pages/ProjectsList';
import ProjectDetail from '../pages/ProjectDetail';
import MaterialsList from '../pages/MaterialsList';
import ContractorsList from '../pages/ContractorsList';
import BillsList from '../pages/BillsList';
import Analytics from '../pages/Analytics';
import {
  AuditLog,
  Settings,
} from '../pages/PlaceholderPages';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ─── Public Routes ──────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ─── Root Redirect ──────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ─── Private Routes wrapped in MainLayout ────────────── */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/materials" element={<MaterialsList />} />
        <Route path="/contractors" element={<ContractorsList />} />
        <Route path="/bills" element={<BillsList />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* ─── 404 Fallback ───────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
