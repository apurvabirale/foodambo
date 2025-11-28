import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Store, Wallet, FileText, Settings, LogOut, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { icon: Store, label: 'My Store', path: '/edit-store', testId: 'my-store-link' },
    { icon: Store, label: 'My Listings', path: '/my-listings', testId: 'my-listings-link' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', testId: 'wallet-link' },
    { icon: FileText, label: 'My Orders', path: '/my-orders', testId: 'my-orders-link' },
    { icon: Settings, label: 'Settings', path: '/settings', testId: 'settings-link' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="profile-page">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 pb-12">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name || 'User'}</h1>
            <p className="text-white/80">{user?.phone || user?.email || ''}</p>
          </div>
        </div>
      </div>

      <div className="-mt-6 px-4">
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-foreground-muted">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">0</p>
              <p className="text-xs text-foreground-muted">Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">0</p>
              <p className="text-xs text-foreground-muted">Reviews</p>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.path}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(item.path)}
                data-testid={item.testId}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-foreground-muted" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground-muted" />
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full mt-6 h-12 text-destructive border-destructive hover:bg-destructive hover:text-white"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;