import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Phone, Mail, Facebook } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
      return;
    }
    
    // Check for Google auth callback
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check both hash and query params for session_id
    let sessionId = null;
    if (hash.includes('session_id=')) {
      sessionId = hash.split('session_id=')[1].split('&')[0];
    } else if (urlParams.has('session_id')) {
      sessionId = urlParams.get('session_id');
    }
    
    if (sessionId) {
      console.log('Google auth callback with session ID:', sessionId);
      handleGoogleAuth(sessionId);
    }
  }, [isAuthenticated]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await authAPI.sendOTP(phone);
      toast.success('OTP sent to your phone');
      setStep('otp');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phone, otp);
      login(response.data.token, response.data.user);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (sessionId) => {
    setLoading(true);
    try {
      console.log('Calling Google auth with session ID:', sessionId);
      const response = await authAPI.googleAuth(sessionId);
      console.log('Google auth response:', response.data);
      login(response.data.token, response.data.user);
      toast.success('Login successful!');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/');
    } catch (error) {
      console.error('Google auth error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Google authentication failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = encodeURIComponent(`${window.location.origin}/login`);
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const handleFacebookLogin = () => {
    toast.info('Facebook login not configured. Please use phone OTP or Google.');
  };

  return (
    <div className="auth-container">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_fresh-neighborhood/artifacts/vv7vq469_Logo1.png" 
            alt="Foodambo" 
            className="w-48 mx-auto mb-4"
            data-testid="app-logo"
          />
          <p className="text-foreground-muted text-lg">Fresh & Homemade, Delivered Local</p>
        </div>

        <Card className="shadow-2xl border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">Welcome Back</CardTitle>
            <CardDescription>Login to discover local homemade delights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-lg"
                    data-testid="phone-input"
                  />
                </div>
                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full btn-primary rounded-full h-12 text-base"
                  data-testid="send-otp-btn"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-2xl text-center tracking-widest"
                    data-testid="otp-input"
                  />
                </div>
                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="w-full btn-primary rounded-full h-12 text-base"
                  data-testid="verify-otp-btn"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep('phone')}
                  className="w-full"
                  data-testid="back-btn"
                >
                  Change Phone Number
                </Button>
              </>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-foreground-muted">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className="rounded-full h-12"
                data-testid="google-login-btn"
              >
                <Mail className="w-5 h-5 mr-2" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={handleFacebookLogin}
                className="rounded-full h-12"
                data-testid="facebook-login-btn"
              >
                <Facebook className="w-5 h-5 mr-2" />
                Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-foreground-muted mt-6">
          By continuing, you agree to Foodambo's Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;