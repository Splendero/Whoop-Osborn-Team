export interface WhoopData {
  heartRate: number;
  hrv: number;
  strain: number;
  recovery: number;
  timestamp: Date;
}

export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  totalAcceleration: number;
  timestamp: Date;
}

export interface AlertType {
  id: string;
  type: 'fall' | 'distress';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  data: WhoopData | MotionData;
  confirmed: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface UserSettings {
  fallDetectionEnabled: boolean;
  distressDetectionEnabled: boolean;
  heartRateThreshold: number;
  countdownDuration: number; // seconds
  emergencyContacts: EmergencyContact[];
}