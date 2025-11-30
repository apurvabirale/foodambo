import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const EmailLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup && !name) {
      toast.error('Please enter your name');
      return;
    }

    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignup ? '/auth/email/signup' : '/auth/email/login';
      const payload = isSignup ? { email, password, name } : { email, password };
      
      const response = await api.post(endpoint, payload);
      
      if (response.data.success && response.data.token) {
        login(response.data.token);
        toast.success(isSignup ? 'Account created successfully!' : 'Login successful!');
        navigate('/');
      } else {
        toast.error('Authentication failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || `${isSignup ? 'Signup' : 'Login'} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-2xl shadow-lg mb-3">
              <span className="text-3xl">🍛</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {isSignup ? 'Create Account' : 'Email Login'}
            </h1>
            <p className="text-foreground-muted">
              {isSignup ? 'Sign up to get started' : 'Login with your email'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={isSignup}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-foreground-muted mt-1">Minimum 6 characters</p>
          </div>

          {!isSignup && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-foreground-muted">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary font-medium hover:underline"
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EmailLogin;