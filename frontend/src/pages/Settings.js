import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Bell, Globe } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [language, setLanguage] = useState('english');

  const handleSave = () => {
    localStorage.setItem('foodambo_settings', JSON.stringify({
      notifications,
      orderNotifications,
      chatNotifications,
      language
    }));
    toast.success('Settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="settings-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {['All Notifications', 'Order Updates', 'Chat Messages'].map((label, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <p className="font-medium">{label}</p>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Language</h2>
          </div>
          
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-2 border rounded">
            <option value="english">English</option>
            <option value="hindi">हिंदी (Hindi)</option>
          </select>
        </Card>

        <Button onClick={handleSave} className="w-full btn-primary h-12 rounded-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
