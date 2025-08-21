import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Activity, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSettings } from "@/types/health";

interface MonitoringStatusProps {
  isMonitoring: boolean;
  settings: UserSettings;
  onToggleMonitoring: () => void;
  className?: string;
}

export const MonitoringStatus = ({ 
  isMonitoring, 
  settings, 
  onToggleMonitoring, 
  className 
}: MonitoringStatusProps) => {
  const getStatusColor = () => {
    if (!isMonitoring) return "bg-muted border-muted";
    return "bg-gradient-success border-success shadow-card-custom";
  };

  const getStatusIcon = () => {
    if (!isMonitoring) return <Shield className="w-5 h-5 text-muted-foreground" />;
    return <ShieldCheck className="w-5 h-5 text-success" />;
  };

  const activeProtections = [
    settings.fallDetectionEnabled && "Fall Detection",
    settings.distressDetectionEnabled && "Distress Detection"
  ].filter(Boolean);

  return (
    <Card className={cn(getStatusColor(), className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>Protection Status</span>
          </div>
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "ACTIVE" : "PAUSED"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isMonitoring ? "Monitoring Active" : "Monitoring Paused"}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeProtections.length > 0 
                ? `${activeProtections.join(" • ")} enabled`
                : "No protections enabled"
              }
            </p>
          </div>
          <Button
            variant={isMonitoring ? "secondary" : "default"}
            size="sm"
            onClick={onToggleMonitoring}
            className="flex items-center gap-2"
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </Button>
        </div>

        {isMonitoring && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-4 h-4 text-chart-primary" />
                <span className="text-xs font-medium">HR Threshold</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {settings.heartRateThreshold} bpm
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="w-4 h-4 text-chart-secondary" />
                <span className="text-xs font-medium">Alert Timer</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {settings.countdownDuration}s
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};