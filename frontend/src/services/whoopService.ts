import { WhoopData, MotionData } from '@/types/health';

// API endpoint configuration
const API_ENDPOINT = "http://localhost:8000/heart-rate-data";

interface ApiConfig {
  endpoint?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  pollingInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface ApiHeartRateData {
  timestamp: string;
  hr: number | null;
  rr_intervals: number[] | null;
  battery: number | null;
}

export class WhoopStreamingService {
  private listeners: ((data: WhoopData) => void)[] = [];
  private motionListeners: ((data: MotionData) => void)[] = [];
  private apiPollingId: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 2000; // 2 seconds
  
  private apiConfig: ApiConfig | null = null;
  private isStreaming = false;

  configureApi(config: ApiConfig = {}) {
    this.apiConfig = {
      endpoint: API_ENDPOINT,
      pollingInterval: 1000,
      retryAttempts: 5,
      retryDelay: 2000,
      ...config
    };
    this.maxRetries = this.apiConfig.retryAttempts || 5;
    this.retryDelay = this.apiConfig.retryDelay || 2000;
  }

  startStreaming() {
    if (!this.apiConfig) {
      this.configureApi();
    }

    this.isStreaming = true;
    this.retryCount = 0;
    this.startApiPolling();
  }

  stopStreaming() {
    this.isStreaming = false;
    this.stopApiPolling();
  }

  private startApiPolling() {
    if (!this.apiConfig || !this.isStreaming) return;

    this.fetchHeartRateData();

    this.apiPollingId = setInterval(() => {
      if (this.isStreaming) {
        this.fetchHeartRateData();
      }
    }, this.apiConfig.pollingInterval);
  }

  private stopApiPolling() {
    if (this.apiPollingId) {
      clearInterval(this.apiPollingId);
      this.apiPollingId = null;
    }
  }

  private async fetchHeartRateData() {
    if (!this.apiConfig) return;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.apiConfig.headers
      };

      if (this.apiConfig.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiConfig.apiKey}`;
      }

      const response = await fetch(this.apiConfig.endpoint!, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const apiData: ApiHeartRateData = await response.json();
      
      // Reset retry count on successful request
      this.retryCount = 0;
      
      // Calculate HRV from RR intervals if available
      let hrv = 0;
      if (apiData.rr_intervals && apiData.rr_intervals.length > 1) {
        // Calculate RMSSD (Root Mean Square of Successive Differences)
        const rrDiffs = [];
        for (let i = 1; i < apiData.rr_intervals.length; i++) {
          rrDiffs.push(Math.pow(apiData.rr_intervals[i] - apiData.rr_intervals[i-1], 2));
        }
        hrv = Math.sqrt(rrDiffs.reduce((sum, diff) => sum + diff, 0) / rrDiffs.length) * 1000; // Convert to ms
      }
      
      const whoopData: WhoopData = {
        heartRate: apiData.hr || 0,
        hrv: hrv,
        strain: 0,
        recovery: 0,
        timestamp: new Date(apiData.timestamp),
        battery: apiData.battery || 0,
        rrIntervals: apiData.rr_intervals || []
      };

      this.listeners.forEach(listener => listener(whoopData));

    } catch (error) {
      console.error('Failed to fetch heart rate data:', error);
      
      // Implement retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying connection... Attempt ${this.retryCount}/${this.maxRetries}`);
        
        // Retry after delay
        setTimeout(() => {
          if (this.isStreaming) {
            this.fetchHeartRateData();
          }
        }, this.retryDelay);
      } else {
        console.error('Max retry attempts reached. Please check your backend server.');
      }
    }
  }

  onDataUpdate(callback: (data: WhoopData) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  onMotionUpdate(callback: (data: MotionData) => void) {
    this.motionListeners.push(callback);
    return () => {
      this.motionListeners = this.motionListeners.filter(l => l !== callback);
    };
  }

  updateHeartRateData(apiData: ApiHeartRateData) {
    // Calculate HRV from RR intervals if available
    let hrv = 0;
    if (apiData.rr_intervals && apiData.rr_intervals.length > 1) {
      const rrDiffs = [];
      for (let i = 1; i < apiData.rr_intervals.length; i++) {
        rrDiffs.push(Math.pow(apiData.rr_intervals[i] - apiData.rr_intervals[i-1], 2));
      }
      hrv = Math.sqrt(rrDiffs.reduce((sum, diff) => sum + diff, 0) / rrDiffs.length) * 1000;
    }

    const whoopData: WhoopData = {
      heartRate: apiData.hr || 0,
      hrv: hrv,
      strain: 0,
      recovery: 0,
      timestamp: new Date(apiData.timestamp),
      battery: apiData.battery || 0,
      rrIntervals: apiData.rr_intervals || []
    };

    this.listeners.forEach(listener => listener(whoopData));
  }

  getStreamingStatus() {
    return {
      isStreaming: this.isStreaming,
      isConfigured: !!this.apiConfig,
      endpoint: this.apiConfig?.endpoint,
      pollingInterval: this.apiConfig?.pollingInterval,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

export const whoopService = new WhoopStreamingService();