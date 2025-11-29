import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { Toaster } from './components/ui/sonner';
import SessionHandler from './components/SessionHandler';
import Login from './pages/Login';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import StoreProfile from './pages/StoreProfile';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import EditStore from './pages/EditStore';
import MyListings from './pages/MyListings';
import Settings from './pages/Settings';
import MyStoreFront from './pages/MyStoreFront';
import SellerOrders from './pages/SellerOrders';
import MyOrders from './pages/MyOrders';
import Inbox from './pages/Inbox';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import LocationSetup from './pages/LocationSetup';
import EditProfile from './pages/EditProfile';
import BottomNav from './components/BottomNav';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Check if user needs to set up location
  if (user && !user.location?.latitude && window.location.pathname !== '/location-setup') {
    return <Navigate to="/location-setup" />;
  }
  
  return children;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <SessionHandler>
      <div className="App">
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/location-setup" element={
          <PrivateRoute>
            <LocationSetup />
          </PrivateRoute>
        } />
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/product/:id" element={
          <PrivateRoute>
            <ProductDetail />
          </PrivateRoute>
        } />
        <Route path="/store/:id" element={
          <PrivateRoute>
            <StoreProfile />
          </PrivateRoute>
        } />
        <Route path="/create-listing" element={
          <PrivateRoute>
            <CreateListing />
          </PrivateRoute>
        } />
        <Route path="/my-listings" element={
          <PrivateRoute>
            <MyListings />
          </PrivateRoute>
        } />
        <Route path="/my-orders" element={
          <PrivateRoute>
            <MyOrders />
          </PrivateRoute>
        } />
        <Route path="/inbox" element={
          <PrivateRoute>
            <Inbox />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/edit-profile" element={
          <PrivateRoute>
            <EditProfile />
          </PrivateRoute>
        } />
        <Route path="/wallet" element={
          <PrivateRoute>
            <Wallet />
          </PrivateRoute>
        } />
        <Route path="/edit-store" element={
          <PrivateRoute>
            <EditStore />
          </PrivateRoute>
        } />
        <Route path="/edit-listing/:id" element={
          <PrivateRoute>
            <EditListing />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />
        <Route path="/my-store-front" element={
          <PrivateRoute>
            <MyStoreFront />
          </PrivateRoute>
        } />
        <Route path="/seller-orders" element={
          <PrivateRoute>
            <SellerOrders />
          </PrivateRoute>
        } />
      </Routes>
      {isAuthenticated && <BottomNav />}
      <Toaster />
    </div>
    </SessionHandler>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;