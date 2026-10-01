import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navbar } from "./components/layout/Navbar";
import { ChatPanel } from "./components/ai/ChatPanel";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Grievances from "./pages/Grievances";
import NewGrievance from "./pages/NewGrievance";
import GrievanceDetail from "./pages/GrievanceDetail";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Documents from "./pages/Documents";
import Payments from "./pages/Payments";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import ApplicationReview from "./pages/officer/ApplicationReview";
import SystemHealth from "./pages/SystemHealth";

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Authenticated users land on /dashboard; guests see the Landing page */
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              {/* /new must come before /:ticketId to avoid "new" being matched as a ticket ID */}
              <Route path="/grievances/new" element={<Protected><NewGrievance /></Protected>} />
              <Route path="/grievances/:ticketId" element={<Protected><GrievanceDetail /></Protected>} />
              <Route path="/grievances" element={<Protected><Grievances /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
              <Route path="/documents" element={<Protected><Documents /></Protected>} />
              <Route path="/payments" element={<Protected><Payments /></Protected>} />

              <Route path="/officer" element={<Protected><OfficerDashboard /></Protected>} />
              <Route path="/officer/grievances/:ticketId" element={<Protected><ApplicationReview /></Protected>} />
              <Route path="/system" element={<SystemHealth />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ChatPanel />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
