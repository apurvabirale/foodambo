import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const SessionHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let isProcessing = false; // Debounce flag
    
    const handleSession = async () => {
      // Prevent multiple simultaneous processing
      if (isProcessing || processing) {
        console.log('SessionHandler: Already processing, skipping...');
        return;
      }
      
      // Check for token in URL query params (direct OAuth)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        console.log('SessionHandler: Found token in query params');
        isProcessing = true;
        setProcessing(true);
        
        try {
          login(token);
          toast.success('Login successful!');
          
          // Clean URL and redirect
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        } catch (error) {
          console.error('Token login error:', error);
          toast.error('Login failed');
        } finally {
          setProcessing(false);
        }
        return;
      }
      
      // Check for session_id in URL hash (Emergent Auth)
      const hash = window.location.hash;
      console.log('SessionHandler: Checking hash:', hash);
      
      if (!hash || !hash.includes('session_id=')) {
        return;
      }
      
      // Mark as processing immediately
      isProcessing = true;
      setProcessing(true);
      
      // Save hash before clearing
      const hashToProcess = hash;
      
      try {
        // Extract session_id with proper validation
        const hashParts = hashToProcess.split('session_id=');
        if (hashParts.length < 2) {
          throw new Error('Invalid hash format: session_id not found');
        }
        
        const sessionIdPart = hashParts[1].split('&')[0];
        const sessionId = sessionIdPart.trim();
        
        // Validate session ID format (should be a UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!sessionId || sessionId.length < 10 || !uuidRegex.test(sessionId)) {
          throw new Error('Invalid session ID format');
        }
        
        console.log('SessionHandler: Valid session_id extracted:', sessionId.substring(0, 20) + '...');
        
        // Clean the hash AFTER validation
        window.history.replaceState(null, '', window.location.pathname);
        
        // Send session_id directly to OUR backend (not to Emergent)
        // Our backend will call Emergent API server-to-server (no CORS issues)
        console.log('SessionHandler: Calling backend auth endpoint...');
        console.log('SessionHandler: Backend URL:', process.env.REACT_APP_BACKEND_URL);
        
        let backendResponse;
        let retryCount = 0;
        const maxRetries = 2;
        
        // Try up to 3 times (initial + 2 retries) with short delays
        while (retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              console.log(`SessionHandler: Retry attempt ${retryCount}/${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
            }
            
            backendResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                session_id: sessionId
              })
            });
            
            // If we get a response, break the retry loop
            if (backendResponse) {
              break;
            }
          } catch (fetchError) {
            console.error(`SessionHandler: Network error (attempt ${retryCount + 1}):`, fetchError);
            
            if (retryCount === maxRetries) {
              throw new Error('Network error: Unable to reach backend server after multiple attempts');
            }
            retryCount++;
          }
        }
        
        if (!backendResponse) {
          throw new Error('Failed to get response from backend after retries');
        }
        
        console.log('SessionHandler: Backend response status:', backendResponse.status);

        if (!backendResponse.ok) {
          const errorText = await backendResponse.text();
          console.error('SessionHandler: Backend auth failed:', backendResponse.status, errorText);
          throw new Error('Backend authentication failed: ' + errorText);
        }

        const authData = await backendResponse.json();
        console.log('SessionHandler: Got auth token, logging in...');
        
        // Store token and login
        await login(authData.token);
        
        console.log('SessionHandler: Authentication complete!');
        toast.success('🎉 Login successful!');
        navigate('/');
      } catch (error) {
        console.error('SessionHandler: Error during authentication:', error);
        console.error('SessionHandler: Error stack:', error.stack);
        
        let errorMessage = '';
        let showOtpTip = true;
        
        if (error.message.includes('Invalid session ID') || error.message.includes('Invalid hash format')) {
          errorMessage = '⚠️ Authentication link expired or invalid. Please try logging in again.';
        } else if (error.message.includes('user_data_not_found') || error.message.includes('expired')) {
          errorMessage = '⏱️ Session expired (expires in 10 sec). Click "Continue with Google" again.';
        } else if (error.message.includes('Network error') || error.message.includes('after multiple attempts')) {
          errorMessage = '🌐 Connection issue. Please check your internet and try again.';
        } else if (error.message.includes('Emergent')) {
          errorMessage = '⚠️ Google authentication service unavailable. Try again in a moment.';
        } else if (error.message.includes('backend') || error.message.includes('Backend')) {
          errorMessage = '⚠️ Server busy. Please try again.';
        } else {
          errorMessage = '❌ Login failed: ' + error.message;
          showOtpTip = false;
        }
        
        toast.error(errorMessage, {
          duration: 6000,
          description: showOtpTip ? '💡 Tip: Phone OTP login works instantly!' : undefined
        });
        
        navigate('/login');
      } finally {
        setProcessing(false);
        isProcessing = false;
      }
    };

    // Run on mount and when location changes
    handleSession();
    
    // Cleanup function
    return () => {
      isProcessing = false;
    };
  }, [location]); // Only depend on location to detect URL changes

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            {/* Foodambo Logo */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Foodambo
              </h1>
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-100"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent absolute top-0"></div>
              </div>
            </div>

            {/* Status Message */}
            <p className="text-gray-700 font-medium mb-2">Completing sign in...</p>
            <p className="text-sm text-gray-500">Setting up your account</p>

            {/* Branding */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                🏠 Discover homemade food from your neighborhood
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default SessionHandler;
