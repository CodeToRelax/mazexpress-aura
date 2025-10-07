import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReduxProvider } from "@/app/providers/ReduxProvider";
import { I18nProvider } from "@/app/providers/I18nProvider";
import { initializeFirebase } from "@/utilities/firebase/firebase";
import { PrivateRoute } from "@/utilities/router/PrivateRoute";
import { PublicRoute } from "@/utilities/router/PublicRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/screens/auth/Login";
import Dashboard from "@/screens/dashboard/Dashboard";
import Users from "@/screens/users/Users";
import UserDetail from "@/screens/users/UserDetail";
import Warehouses from "@/screens/warehouses/Warehouses";
import WarehouseDetail from "@/screens/warehouses/WarehouseDetail";
import SystemSettings from "@/screens/settings/SystemSettings";
import NotFound from "./pages/NotFound";

// Initialize Firebase on app start
initializeFirebase();

const App = () => {
  useEffect(() => {
    // Set initial language direction
    const lang = localStorage.getItem('i18nextLng') || 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  return (
    <ReduxProvider>
      <I18nProvider>
        <Toaster />
        <Sonner position="bottom-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<UserDetail />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/warehouses/:id" element={<WarehouseDetail />} />
              <Route path="/settings" element={<SystemSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ReduxProvider>
  );
};

export default App;
