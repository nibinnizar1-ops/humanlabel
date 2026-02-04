import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardConfigProvider } from "@/contexts/DashboardConfigContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import Sales from "./pages/Sales";
import NewSale from "./pages/NewSale";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import CustomerDetail from "./pages/CustomerDetail";
import CustomerEdit from "./pages/CustomerEdit";
import Expenses from "./pages/Expenses";
import ExpenseForm from "./pages/ExpenseForm";
import ExpenseEdit from "./pages/ExpenseEdit";
import Charity from "./pages/Charity";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <DashboardConfigProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            
            <Route path="/products/new" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProductForm />
              </ProtectedRoute>
            } />
            
            <Route path="/products/:id" element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            } />
            
            <Route path="/sales" element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            } />
            
            <Route path="/sales/new" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <NewSale />
              </ProtectedRoute>
            } />
            
            <Route path="/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            
            <Route path="/customers/new" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <CustomerForm />
              </ProtectedRoute>
            } />
            
            <Route path="/customers/:id" element={
              <ProtectedRoute>
                <CustomerDetail />
              </ProtectedRoute>
            } />
            
            <Route path="/customers/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <CustomerEdit />
              </ProtectedRoute>
            } />
            
            <Route path="/expenses" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <Expenses />
              </ProtectedRoute>
            } />
            
            <Route path="/expenses/new" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <ExpenseForm />
              </ProtectedRoute>
            } />
            
            <Route path="/expenses/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <ExpenseEdit />
              </ProtectedRoute>
            } />
            
            <Route path="/charity" element={
              <ProtectedRoute>
                <Charity />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </DashboardConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;