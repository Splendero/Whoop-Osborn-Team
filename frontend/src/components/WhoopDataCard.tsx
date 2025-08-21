import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhoopData } from "@/types/health";
import { Heart, Activity, Zap, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhoopDataCardProps {
  data: WhoopData | null;
  className?: string;
}

export const WhoopDataCard = ({ data, className }: WhoopDataCardProps) => {
  if (!data) {
    return (
      <Card className={cn("bg-card/50 border-border/50", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-muted rounded-full" />
            WHOOP Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connecting to WHOOP...</p>
        </CardContent>
      </Card>
    );
  }

  const getHeartRateStatus = (hr: number) => {
    if (hr > 120) return { status: "high", color: "bg-warning", textColor: "text-warning-foreground" };
    if (hr > 100) return { status: "elevated", color: "bg-chart-warning", textColor: "text-warning-foreground" };
    if (hr < 50) return { status: "low", color: "bg-muted", textColor: "text-muted-foreground" };
    return { status: "normal", color: "bg-success", textColor: "text-success-foreground" };
  };

  const getHRVStatus = (hrv: number) => {
    if (hrv > 50) return { status: "good", color: "bg-success" };
    if (hrv > 30) return { status: "fair", color: "bg-warning" };
    return { status: "poor", color: "bg-destructive" };
  };

  const hrStatus = getHeartRateStatus(data.heartRate);
  const hrvStatus = getHRVStatus(data.hrv);

  return (
    <Card className={cn("bg-gradient-primary shadow-health border-primary/20", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            WHOOP Live
          </div>
          <Badge variant="secondary" className="text-xs">
            {data.timestamp.toLocaleTimeString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-chart-danger" />
              <span className="text-sm font-medium">Heart Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{Math.round(data.heartRate)}</span>
              <span className="text-sm text-muted-foreground">bpm</span>
              <Badge className={cn("text-xs", hrStatus.color, hrStatus.textColor)}>
                {hrStatus.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-chart-secondary" />
              <span className="text-sm font-medium">HRV</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{Math.round(data.hrv)}</span>
              <span className="text-sm text-muted-foreground">ms</span>
              <Badge className={cn("text-xs", hrvStatus.color)}>
                {hrvStatus.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-chart-warning" />
              <span className="text-sm font-medium">Strain</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.strain.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">/21</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-chart-accent" />
              <span className="text-sm font-medium">Recovery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{Math.round(data.recovery)}</span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};