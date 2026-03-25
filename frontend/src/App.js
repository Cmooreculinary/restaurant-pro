import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Pricing from "@/pages/Pricing";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import Onboarding from "@/pages/Onboarding";
import BusinessProfile from "@/pages/BusinessProfile";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.withCredentials = true;

// Auth Context
export const AuthContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return children({ user, setUser, checkAuth });
};

// Protected Route wrapper
const ProtectedRoute = ({ user, children, requireOnboarding = false }) => {
  if (!user) {
    return <Landing />;
  }
  
  // Redirect to onboarding if not completed and not already on onboarding page
  if (!user.onboarding_completed && !requireOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

// App Router
function AppRouter() {
  return (
    <AuthContext>
      {({ user, setUser, checkAuth }) => (
        <Routes>
          <Route 
            path="/" 
            element={user ? (
              user.onboarding_completed ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/onboarding" replace />
            ) : <Landing />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} setUser={setUser} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/onboarding" 
            element={user ? <Onboarding user={user} /> : <Landing />} 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute user={user}>
                <BusinessProfile user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pricing" 
            element={<Pricing user={user} />} 
          />
          <Route 
            path="/subscription/success" 
            element={<SubscriptionSuccess user={user} />} 
          />
        </Routes>
      )}
    </AuthContext>
  );
}

function App() {
  return (
    <div className="grain-overlay">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
