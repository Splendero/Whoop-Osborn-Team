import { useState, useEffect } from "react";
import { WhoopDataCard } from "@/components/WhoopDataCard";
import { MonitoringStatus } from "@/components/MonitoringStatus";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { useWhoopMonitoring } from "@/hooks/useWhoopMonitoring";
import { UserSettings, EmergencyContact } from "@/types/health";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Shield, AlertTriangle, Settings, Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { whoopService } from "@/services/whoopService";

const Index = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  // Default settings for the demo
  const [userSettings] = useState<UserSettings>({
    fallDetectionEnabled: true,
    distressDetectionEnabled: true,
    heartRateThreshold: 120,
    countdownDuration: 15,
    emergencyContacts: [
      {
        id: '1',
        name: 'Dr. Sarah Wilson',
        phone: '+1-555-0123',
        relationship: 'Primary Care Physician',
        isPrimary: true
      },
      {
        id: '2',
        name: 'Emergency Services',
        phone: '911',
        relationship: 'Emergency Response',
        isPrimary: false
      },
      {
        id: '3',
        name: 'Alex Johnson',
        phone: '+1-555-0456',
        relationship: 'Emergency Contact',
        isPrimary: false
      }
    ] as EmergencyContact[]
  });

  const {
    currentData,
    activeAlert,
    isMonitoring,
    cancelAlert,
    confirmAlert,
    startMonitoring,
    stopMonitoring
  } = useWhoopMonitoring(userSettings);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  // Auto-start monitoring when component mounts
  useEffect(() => {
    // Configure the API endpoint
    whoopService.configureApi({
      endpoint: "http://localhost:8000/heart-rate-data",
      pollingInterval: 1000
    });

    // Start monitoring automatically
    startMonitoring();
    setConnectionStatus('connecting');

    // Check connection status after a few seconds
    const statusCheck = setTimeout(() => {
      const status = whoopService.getStreamingStatus();
      if (status.isStreaming) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    }, 3000);

    return () => {
      clearTimeout(statusCheck);
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Update connection status when data is received
  useEffect(() => {
    if (currentData) {
      setConnectionStatus('connected');
    }
  }, [currentData]);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to API';
      case 'connecting':
        return 'Connecting to API...';
      case 'error':
        return 'Connection Error';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-gradient-primary">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            WHOOP Guardian
          </h1>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Real-time fall detection and distress monitoring with WHOOP integration
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-xs">
            MVP Research Build • Not for Medical Use
          </Badge>
          <div className="flex items-center gap-1 text-xs">
            {getConnectionStatusIcon()}
            <span className={connectionStatus === 'connected' ? 'text-green-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-blue-600'}>
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="max-w-4xl mx-auto grid gap-6">
        {/* WHOOP Data */}
        <WhoopDataCard data={currentData} />
        
        {/* Monitoring Status */}
        <MonitoringStatus 
          isMonitoring={isMonitoring}
          settings={userSettings}
          onToggleMonitoring={handleToggleMonitoring}
        />

        {/* Emergency Contacts */}
        <EmergencyContacts contacts={userSettings.emergencyContacts} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto py-4"
            onClick={() => navigate("/test-fall")}
          >
            <Shield className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Test Fall Detection</div>
              <div className="text-xs text-muted-foreground">Simulate emergency</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto py-4"
            onClick={() => navigate("/health-history")}
          >
            <Heart className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Health History</div>
              <div className="text-xs text-muted-foreground">View past alerts</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto py-4"
            onClick={() => navigate("/configure-settings")}
          >
            <Settings className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Configure Settings</div>
              <div className="text-xs text-muted-foreground">Adjust thresholds</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Emergency Alert Overlay */}
      <EmergencyAlert
        alert={activeAlert}
        countdownDuration={userSettings.countdownDuration}
        onCancel={cancelAlert}
        onConfirm={confirmAlert}
      />

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground mt-12">
        <p>⚠️ This is an MVP for research/education purposes only</p>
        <p>Not a medical device • Always obtain consent • Follow local regulations</p>
      </footer>
    </div>
  );
};

export default Index;
