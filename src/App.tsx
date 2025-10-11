import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReduxProvider } from "@/app/providers/ReduxProvider";
import { I18nProvider } from "@/app/providers/I18nProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";
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
import Shipments from "@/screens/shipments/Shipments";
import ShipmentDetail from "@/screens/shipments/ShipmentDetail";
import SystemSettings from "@/screens/settings/SystemSettings";
import WalletDashboard from "@/screens/wallet/WalletDashboard";
import Transactions from "@/screens/wallet/Transactions";
import Invoices from "@/screens/invoices/Invoices";
import InvoiceDetail from "@/screens/invoices/InvoiceDetail";
import TrackShipment from "@/pages/TrackShipment";
import PriceCalculator from "@/pages/PriceCalculator";
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
      <QueryProvider>
        <I18nProvider>
          <Toaster />
          <Sonner position="bottom-center" />
          <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/track" element={<TrackShipment />} />
            <Route path="/calculate-price" element={<PriceCalculator />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<UserDetail />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/warehouses/:id" element={<WarehouseDetail />} />
              <Route path="/shipments" element={<Shipments />} />
              <Route path="/shipments/:id" element={<ShipmentDetail />} />
              <Route path="/wallet" element={<WalletDashboard />} />
              <Route path="/wallet/transactions" element={<Transactions />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/settings" element={<SystemSettings />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </I18nProvider>
      </QueryProvider>
    </ReduxProvider>
  );
};

export default App;
