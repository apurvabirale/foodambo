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
      if (hash && hash.includes('session_id=')) {
        setProcessing(true);
        
        try {
          // Extract session_id from hash
          const sessionId = hash.split('session_id=')[1].split('&')[0];
          
          // Call Emergent's session data endpoint
          const response = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
            headers: {
              'X-Session-ID': sessionId
            }
          });

          if (!response.ok) {
            throw new Error('Failed to get session data');
          }

          const data = await response.json();
          
          // Send session data to our backend to create user and get token
          const backendResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              session_id: sessionId
            })
          });

          if (!backendResponse.ok) {
            throw new Error('Backend authentication failed');
          }

          const authData = await backendResponse.json();
          
          // Store token and login
          login(authData.token);
          
          // Clean URL hash
          window.history.replaceState(null, '', window.location.pathname);
          
          toast.success('Login successful!');
          navigate('/');
        } catch (error) {
          console.error('Session handling error:', error);
          toast.error('Authentication failed. Please try again.');
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
