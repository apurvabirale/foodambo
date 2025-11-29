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
        setProcessing(true);
        console.log('SessionHandler: Found session_id, processing...');
        
        try {
          // Extract session_id from hash
          const sessionId = hash.split('session_id=')[1].split('&')[0];
          console.log('SessionHandler: Extracted session_id:', sessionId.substring(0, 20) + '...');
          
          // Call Emergent's session data endpoint
          console.log('SessionHandler: Calling Emergent session-data endpoint...');
          const response = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
            headers: {
              'X-Session-ID': sessionId
            }
          });

          if (!response.ok) {
            console.error('SessionHandler: Emergent API failed:', response.status, await response.text());
            throw new Error('Failed to get session data');
          }

          const data = await response.json();
          console.log('SessionHandler: Got user data:', data.email);
          
          // Send session data to our backend to create user and get token
          console.log('SessionHandler: Calling backend auth endpoint...');
          const backendResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              session_id: sessionId
            })
          });
          
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
          toast.error('Authentication failed: ' + error.message);
          // Clean URL hash
          window.history.replaceState(null, '', window.location.pathname);
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
