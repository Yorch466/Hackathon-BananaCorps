import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface UseLocationResult {
  location: UserLocation | null;
  errorMsg: string | null;
  loading: boolean;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriberRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!cancelled) {
          setErrorMsg(
            canAskAgain
              ? 'Permiso de ubicación denegado.'
              : 'Permiso de ubicación denegado permanentemente. Actívalo en Ajustes del dispositivo.',
          );
          setLoading(false);
        }
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (!cancelled) {
          setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setErrorMsg('No se pudo obtener la ubicación. Verifica que el GPS esté activo.');
          setLoading(false);
        }
        // No hacer return: watchPositionAsync se activa cuando el GPS se enciende
      }

      subscriberRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (pos) => {
          if (!cancelled) {
            setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            setErrorMsg(null); // GPS volvió — limpiar el error
            setLoading(false);
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      subscriberRef.current?.remove();
    };
  }, []);

  return { location, errorMsg, loading };
}
