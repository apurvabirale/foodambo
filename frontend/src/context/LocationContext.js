import React, { createContext, useState, useContext, useEffect } from 'react';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading && !location) {
        setError('Location request timed out');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLoading(false);
        },
        (err) => {
          clearTimeout(timeout);
          setError(err.message);
          setLoading(false);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false,
          maximumAge: 300000 // Cache position for 5 minutes
        }
      );
    } else {
      clearTimeout(timeout);
      setError('Geolocation is not supported');
      setLoading(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LocationContext.Provider value={{ location, loading, error, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};