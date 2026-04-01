import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDevice() {
  const [device, setDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      if (window.innerWidth < 768) {
        setDevice('mobile');
      } else if (window.innerWidth < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
  };
}
