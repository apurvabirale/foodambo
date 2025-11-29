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
      
      // Check for session_id in URL hash
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
                }),
                timeout: 10000
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
          login(authData.token);
          
          // Clean URL hash
          window.history.replaceState(null, '', window.location.pathname);
          
          console.log('SessionHandler: Authentication complete!');
          toast.success('Login successful!');
          navigate('/');
        } catch (error) {
          console.error('SessionHandler: Error during authentication:', error);
          console.error('SessionHandler: Error stack:', error.stack);
          
          let errorMessage = '';
          let showOtpTip = true;
          
          if (error.message.includes('Invalid session ID') || error.message.includes('Invalid hash format')) {
            errorMessage = '⚠️ Authentication link expired or invalid. Please try logging in again.';
          } else if (error.message.includes('user_data_not_found') || error.message.includes('expired')) {
            errorMessage = '⏱️ Session expired (they expire in 10 seconds). Click "Continue with Google" again.';
          } else if (error.message.includes('Network error') || error.message.includes('after multiple attempts')) {
            errorMessage = '🌐 Connection issue. Please check your internet and try again.';
          } else if (error.message.includes('Emergent')) {
            errorMessage = '⚠️ Google authentication service unavailable. Try again in a moment.';
          } else if (error.message.includes('backend')) {
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
        }
      }
    };

    // Run on mount and when location changes
    handleSession();
    
    // Cleanup function
    return () => {
      isProcessing = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]); // Only depend on location to detect URL changes

  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
          <p className="text-lg font-medium text-foreground">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default SessionHandler;
