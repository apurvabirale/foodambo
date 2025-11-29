import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const cuisineImages = [
  { src: 'https://images.unsplash.com/photo-1630870487699-1a6d8b24cc1f?w=400', label: 'Maharashtrian' },
  { src: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', label: 'North Indian' },
  { src: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', label: 'Punjabi' },
  { src: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400', label: 'South Indian' },
  { src: 'https://images.unsplash.com/photo-1683533678059-63c6a0e9e3ef?w=400', label: 'Coastal' },
  { src: 'https://images.unsplash.com/photo-1743674453123-93356ade2891?w=400', label: 'Bengali' },
  { src: 'https://images.unsplash.com/photo-1631451457509-454a498df1c0?w=400', label: 'Street Food' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle Google OAuth callback
    const token = searchParams.get('token');
    if (token) {
      login(token);
      toast.success('Login successful!');
      navigate('/');
    }
  }, [searchParams, login, navigate]);

  // Google-only login - OTP functions removed

  const handleGoogleLogin = () => {
    // Redirect to Emergent Auth with main app as redirect_url (not login page)
    const redirectUrl = `${window.location.origin}/`;
    const authUrl = process.env.REACT_APP_AUTH_URL || 'https://auth.emergentagent.com';
    window.location.href = `${authUrl}/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Cuisine Collage */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600">
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10"></div>
        
        {/* Cuisine Images Grid */}
        <div className="absolute inset-0 grid grid-cols-3 gap-2 p-8">
          {cuisineImages.map((img, idx) => (
            <div 
              key={idx}
              className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-300"
              style={{
                animationDelay: `${idx * 0.1}s`,
                animation: 'fadeInUp 0.6s ease-out forwards',
              }}
            >
              <img 
                src={img.src} 
                alt={img.label} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-sm font-semibold">{img.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Message */}
        <div className="absolute bottom-8 left-8 right-8 z-20 text-white">
          <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">Discover Authentic Flavors</h2>
          <p className="text-xl font-medium drop-shadow-md">From every corner of India, delivered to your doorstep</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Branding */}
          <div className="text-center space-y-3">
            <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-3xl shadow-xl mb-4">
              <span className="text-5xl">🍛</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Foodambo
            </h1>
            <p className="text-xl font-semibold text-orange-700">Authentic as ever</p>
            <p className="text-foreground-muted">Experience the most authentic cuisines</p>
          </div>

          {/* Mobile Cuisine Preview */}
          <div className="lg:hidden">
            <div className="grid grid-cols-4 gap-2 mb-6">
              {cuisineImages.slice(0, 4).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden shadow-md">
                  <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-orange-100">
            <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Welcome!</h2>
            <p className="text-center text-foreground-muted mb-6">Sign in to discover homemade food</p>
            
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 flex items-center justify-center gap-3 text-base font-semibold rounded-xl shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-center text-orange-800">
                🏠 Connect with local home chefs and discover authentic homemade food
              </p>
            </div>

            <p className="text-xs text-center text-foreground-muted mt-4">
              By continuing, you agree to our Terms & Privacy Policy
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🏠</div>
              <p className="text-xs text-foreground-muted font-medium">Homemade</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-xs text-foreground-muted font-medium">Local</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-xs text-foreground-muted font-medium">Authentic</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
