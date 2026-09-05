import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Shell from "./components/Shell";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLayout from "./pages/AuthLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Analytics from "./pages/Analytics";
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<Shell />}>
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}
