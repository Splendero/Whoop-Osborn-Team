import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertType } from "@/types/health";
import { AlertTriangle, Phone, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencyAlertProps {
  alert: AlertType | null;
  countdownDuration: number;
  onCancel: () => void;
  onConfirm: () => void;
  className?: string;
}

export const EmergencyAlert = ({ 
  alert, 
  countdownDuration, 
  onCancel, 
  onConfirm,
  className 
}: EmergencyAlertProps) => {
  const [countdown, setCountdown] = useState(countdownDuration);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setCountdown(countdownDuration);
      setIsVisible(true);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onConfirm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
    }
  }, [alert, countdownDuration, onConfirm]);

  if (!alert || !isVisible) return null;

  const getSeverityColor = (severity: AlertType['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-gradient-emergency border-emergency shadow-emergency';
      case 'high': return 'bg-destructive/90 border-destructive';
      case 'medium': return 'bg-warning/90 border-warning';
      default: return 'bg-muted/90 border-muted';
    }
  };

  const getAlertIcon = (type: AlertType['type']) => {
    switch (type) {
      case 'fall': return '🚨';
      case 'distress': return '💔';
      default: return '⚠️';
    }
  };

  const getAlertTitle = (type: AlertType['type']) => {
    switch (type) {
      case 'fall': return 'Fall Detected';
      case 'distress': return 'Distress Signal';
      default: return 'Emergency Alert';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={cn(
        "w-full max-w-md animate-in zoom-in-95 duration-300",
        getSeverityColor(alert.severity),
        className
      )}>
        <CardHeader className="text-center pb-4">
          <div className="text-4xl mb-2">{getAlertIcon(alert.type)}</div>
          <CardTitle className="text-xl text-foreground">
            {getAlertTitle(alert.type)}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto">
            {alert.severity.toUpperCase()} PRIORITY
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-foreground mb-2">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground">
              Emergency contacts will be notified automatically
            </p>
          </div>

          <div className="bg-background/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Detection Time:</span>
              <span>{alert.timestamp.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Alert Type:</span>
              <span className="capitalize">{alert.type}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Severity:</span>
              <span className="capitalize">{alert.severity}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="secondary" 
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={onConfirm}
              className="flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This will call and text your emergency contacts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};