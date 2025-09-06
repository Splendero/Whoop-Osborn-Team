import { useState, useEffect, useCallback } from 'react';
import { WhoopData, MotionData, AlertType, UserSettings } from '@/types/health';
import { whoopService } from '@/services/whoopService';

export const useWhoopMonitoring = (settings: UserSettings) => {
  const [currentData, setCurrentData] = useState<WhoopData | null>(null);
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [activeAlert, setActiveAlert] = useState<AlertType | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Store recent data for trend analysis
  const [recentHeartRates, setRecentHeartRates] = useState<number[]>([]);
  const [recentMotion, setRecentMotion] = useState<MotionData[]>([]);

  const detectDistress = useCallback((data: WhoopData, recentHRs: number[]) => {
    if (!settings.distressDetectionEnabled) return false;

    // Distress indicators:
    // 1. Heart rate significantly above threshold
    // 2. Rapid heart rate increase
    // 3. Sustained high heart rate
    
    const isHighHR = data.heartRate > settings.heartRateThreshold;
    const rapidIncrease = recentHRs.length >= 3 && 
      data.heartRate > recentHRs[recentHRs.length - 1] + 20;
    
    const sustainedHigh = recentHRs.slice(-5).every(hr => hr > settings.heartRateThreshold - 10);

    return isHighHR && (rapidIncrease || sustainedHigh);
  }, [settings]);

  const detectFall = useCallback((motion: MotionData, recentMotions: MotionData[]) => {
    if (!settings.fallDetectionEnabled) return false;

    // Fall detection heuristic:
    // 1. Sudden high acceleration (impact)
    // 2. Followed by low motion (stillness)
    
    const highAcceleration = motion.totalAcceleration > 3.0; // Significant impact
    
    // Check for stillness in recent motion (last 5 seconds)
    const recentStillness = recentMotions.slice(-5).every(m => 
      m.totalAcceleration < 1.5 // Minimal movement
    );

    return highAcceleration && recentMotions.length > 5 && recentStillness;
  }, [settings]);

  const createAlert = useCallback((type: 'fall' | 'distress', data: WhoopData | MotionData): AlertType => {
    // Determine severity based on data
    let severity: AlertType['severity'] = 'medium';
    
    if (type === 'fall') {
      const motionData = data as MotionData;
      severity = motionData.totalAcceleration > 5.0 ? 'critical' : 'high';
    } else if (type === 'distress') {
      const whoopData = data as WhoopData;
      severity = whoopData.heartRate > settings.heartRateThreshold + 30 ? 'critical' : 'high';
    }

    return {
      id: crypto.randomUUID(),
      type,
      severity,
      timestamp: new Date(),
      data,
      confirmed: false
    };
  }, [settings]);

  const handleDataUpdate = useCallback((data: WhoopData) => {
    setCurrentData(data);
    
    // Update recent heart rates (keep last 120 readings)
    setRecentHeartRates(prev => {
      const updated = [...prev, data.heartRate].slice(-120);
      
      // Check for distress
      if (detectDistress(data, updated) && !activeAlert) {
        const alert = createAlert('distress', data);
        setActiveAlert(alert);
      }
      
      return updated;
    });
  }, [detectDistress, createAlert, activeAlert]);

  const handleMotionUpdate = useCallback((motion: MotionData) => {
    setMotionData(motion);
    
    // Update recent motion data (keep last 30 readings - 30 seconds)
    setRecentMotion(prev => {
      const updated = [...prev, motion].slice(-30);
      
      // Check for fall
      if (detectFall(motion, updated) && !activeAlert) {
        const alert = createAlert('fall', motion);
        setActiveAlert(alert);
      }
      
      return updated;
    });
  }, [detectFall, createAlert, activeAlert]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    whoopService.startStreaming();
    
    const unsubscribeData = whoopService.onDataUpdate(handleDataUpdate);
    const unsubscribeMotion = whoopService.onMotionUpdate(handleMotionUpdate);
    
    return () => {
      unsubscribeData();
      unsubscribeMotion();
    };
  }, [handleDataUpdate, handleMotionUpdate]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    whoopService.stopStreaming();
  }, []);

  const cancelAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const confirmAlert = useCallback(() => {
    if (activeAlert) {
      // Here you would implement the actual emergency contact logic
      console.log('Emergency confirmed! Contacting emergency contacts...', activeAlert);
      
      // For demo purposes, just clear the alert after a moment
      setTimeout(() => {
        setActiveAlert(null);
      }, 2000);
    }
  }, [activeAlert]);

  useEffect(() => {
    return startMonitoring();
  }, [startMonitoring]);

  return {
    currentData,
    motionData,
    activeAlert,
    isMonitoring,
    recentHeartRates,
    cancelAlert,
    confirmAlert,
    startMonitoring,
    stopMonitoring
  };
};
