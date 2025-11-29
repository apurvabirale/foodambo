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
    const handleSession = async () => {
      // Check for session_id in URL hash
      const hash = window.location.hash;
      console.log('SessionHandler: Checking hash:', hash);
      
      if (hash && hash.includes('session_id=')) {
        // Clean the hash immediately to prevent multiple processing
        const hashToProcess = hash;
        window.history.replaceState(null, '', window.location.pathname);
        
        setProcessing(true);
        console.log('SessionHandler: Found session_id, processing...');
        
        try {
          // Extract session_id from hash
          const sessionId = hashToProcess.split('session_id=')[1].split('&')[0];
          console.log('SessionHandler: Extracted session_id:', sessionId.substring(0, 20) + '...');
          
          // Call Emergent's session data endpoint
          console.log('SessionHandler: Calling Emergent session-data endpoint...');
          let response;
          let data;
          
          try {
            response = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
              headers: {
                'X-Session-ID': sessionId
              }
            });
          } catch (fetchError) {
            console.error('SessionHandler: Network error calling Emergent API:', fetchError);
            throw new Error('Network error: Unable to reach authentication service');
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error('SessionHandler: Emergent API failed:', response.status, errorText);
            throw new Error('Failed to get session data from Emergent');
          }

          try {
            data = await response.json();
            console.log('SessionHandler: Got user data:', data.email);
          } catch (jsonError) {
            console.error('SessionHandler: Failed to parse Emergent response:', jsonError);
            throw new Error('Invalid response from authentication service');
          }
          
          // Send session data to our backend to create user and get token
          console.log('SessionHandler: Calling backend auth endpoint...');
          console.log('SessionHandler: Backend URL:', process.env.REACT_APP_BACKEND_URL);
          
          let backendResponse;
          try {
            backendResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                session_id: sessionId
              })
            });
          } catch (fetchError) {
            console.error('SessionHandler: Network error calling backend:', fetchError);
            throw new Error('Network error: Unable to reach backend server');
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
          
          let errorMessage = 'Authentication failed. ';
          if (error.message.includes('user_data_not_found') || error.message.includes('expired')) {
            errorMessage += 'Session expired. Please try logging in again.';
          } else if (error.message.includes('Network error')) {
            errorMessage += 'Please try again.';
          } else if (error.message.includes('Emergent')) {
            errorMessage += 'Google authentication service is temporarily unavailable.';
          } else if (error.message.includes('backend')) {
            errorMessage += 'Server is temporarily unavailable.';
          } else {
            errorMessage += error.message;
          }
          
          toast.error(errorMessage);
          navigate('/login');
        } finally {
          setProcessing(false);
        }
      }
    };

    handleSession();
  }, [location, login, navigate]);

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
