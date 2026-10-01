import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Audit from './pages/Audit';
import AuditLog from './pages/AuditLog';
import BankTransactions from './pages/BankTransactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const SIDEBAR_FULL = 240;
const SIDEBAR_COLLAPSED = 64;
const TOPBAR_HEIGHT = 56;

/** Route guard — redirects unauthenticated users to /login */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <Topbar sidebarWidth={sidebarWidth} />

      {/* Main content area */}
      <main
        style={{
          marginLeft: sidebarWidth,
          paddingTop: TOPBAR_HEIGHT,
          transition: 'margin-left 0.3s',
          minHeight: '100vh',
        }}
        className="p-6"
      >
        {/* Ambient background glow */}
        <div
          className="fixed pointer-events-none"
          style={{
            top: '20%',
            left: '50%',
            width: '80vw',
            height: '60vh',
            transform: 'translateX(-20%)',
            background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.04) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:gstin" element={<VendorDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id/*" element={<InvoiceDetail />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/bank-transactions" element={<BankTransactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
