import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Heart, AlertTriangle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HealthEvent {
  id: string;
  type: 'fall' | 'distress' | 'test';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  details: string;
}

const mockHealthHistory: HealthEvent[] = [
  {
    id: '1',
    type: 'test',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    severity: 'medium',
    resolved: true,
    details: 'Fall detection simulation test completed successfully'
  },
  {
    id: '2',
    type: 'distress',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    severity: 'high',
    resolved: true,
    details: 'Heart rate elevated to 145 BPM during exercise - false positive'
  },
  {
    id: '3',
    type: 'fall',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    severity: 'low',
    resolved: true,
    details: 'Minor impact detected - user cancelled alert'
  }
];

const HealthHistory = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'fall': return Shield;
      case 'distress': return Heart;
      case 'test': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Health History</h1>
          <p className="text-muted-foreground text-sm">Past alerts and events</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Period Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          {mockHealthHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No health events recorded</p>
              </CardContent>
            </Card>
          ) : (
            mockHealthHistory.map((event) => {
              const IconComponent = getEventIcon(event.type);
              return (
                <Card key={event.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-accent">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{event.type} Event</span>
                            <Badge variant={getSeverityColor(event.severity)} className="text-xs">
                              {event.severity}
                            </Badge>
                            {event.resolved && (
                              <Badge variant="outline" className="text-xs text-success">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.details}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-chart-secondary">3</div>
                <div className="text-xs text-muted-foreground">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">3</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-chart-accent">0</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthHistory;