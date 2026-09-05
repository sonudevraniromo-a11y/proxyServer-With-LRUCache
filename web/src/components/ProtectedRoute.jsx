import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function ProtectedRoute() {
  const { user, checking } = useAuth();
  if (checking) return <div className="center-state">Checking session...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
