/**
 * Network Status Hook
 *
 * Detects online/offline status using navigator.onLine API
 * Provides real-time updates when network connectivity changes
 *
 * Usage:
 *   const isOnline = useNetworkStatus();
 *   if (!isOnline) {
 *     // Show offline UI
 *   }
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * @returns boolean - true if online, false if offline
 */
export const useNetworkStatus = (): boolean => {
  // Initialize with current status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // Handler when network comes online
    const handleOnline = () => {
      console.log('[NetworkStatus] Network connection restored');
      setIsOnline(true);
    };

    // Handler when network goes offline
    const handleOffline = () => {
      console.log('[NetworkStatus] Network connection lost');
      setIsOnline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Hook with callback for network status changes
 * @param onOnline - Callback when network comes online
 * @param onOffline - Callback when network goes offline
 * @returns boolean - current online status
 */
export const useNetworkStatusWithCallbacks = (
  onOnline?: () => void,
  onOffline?: () => void
): boolean => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[NetworkStatus] Network connection restored');
      setIsOnline(true);
      if (onOnline) {
        onOnline();
      }
    };

    const handleOffline = () => {
      console.log('[NetworkStatus] Network connection lost');
      setIsOnline(false);
      if (onOffline) {
        onOffline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  return isOnline;
};

export default useNetworkStatus;
