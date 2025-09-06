import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeartRateGraphProps {
  heartRates: number[];
  className?: string;
}

export const HeartRateGraph = ({ heartRates, className }: HeartRateGraphProps) => {
  // Create chart data from heart rate array
  const chartData = heartRates.map((hr, index) => ({
    time: index,
    heartRate: hr,
  }));

  // Calculate min/max for Y axis with fallbacks
  const currentHR = heartRates.length > 0 ? heartRates[heartRates.length - 1] : 0;
  const minHR = heartRates.length > 0 ? Math.round(Math.max(currentHR / 1.1, 40)) : 40;
  const maxHR = heartRates.length > 0 ? Math.round(Math.min(1.1 * currentHR, 200)) : 170;

  if (heartRates.length === 0) {
    return (
      <Card className={cn("bg-card/50 border-border/50", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-chart-danger" />
            Heart Rate History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No heart rate data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics
  const averageHR = heartRates.length > 0 
    ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
    : 0;
  const peakHR = heartRates.length > 0 ? Math.max(...heartRates) : 0;

  return (
    <Card className={cn("bg-card/50 border-border/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-chart-danger" />
          Heart Rate History
          <span className="text-sm font-normal text-muted-foreground">
            ({heartRates.length} readings)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke=" hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, heartRates.length - 1]}
                ticks={[]}
                tick={false}
                />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[minHR , maxHR]}
                tickFormatter={(value) => `${value} bpm`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Time
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {heartRates.length - 1 - data.time}s ago
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Heart Rate
                            </span>
                            <span className="font-bold">
                              {data.heartRate} bpm
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--chart-primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <div className="text-2xl font-bold text-chart-primary">
              {Math.round(currentHR)}
            </div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-chart-secondary">
              {averageHR}
            </div>
            <div className="text-xs text-muted-foreground">Average</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-chart-warning">
              {peakHR}
            </div>
            <div className="text-xs text-muted-foreground">Peak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};