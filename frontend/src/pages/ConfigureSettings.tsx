import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings, Heart, Shield, Phone, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ConfigureSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    fallDetectionEnabled: true,
    distressDetectionEnabled: true,
    heartRateThreshold: 120,
    countdownDuration: 15,
    autoCallEnabled: false,
    emergencyNumber: "911"
  });

  const handleSave = () => {
    // In a real app, this would save to a backend or local storage
    toast({
      title: "Settings saved",
      description: "Your monitoring preferences have been updated.",
    });
  };

  const handleReset = () => {
    setSettings({
      fallDetectionEnabled: true,
      distressDetectionEnabled: true,
      heartRateThreshold: 120,
      countdownDuration: 15,
      autoCallEnabled: false,
      emergencyNumber: "911"
    });
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    });
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
          <h1 className="text-2xl font-bold">Configure Settings</h1>
          <p className="text-muted-foreground text-sm">Adjust monitoring preferences</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Detection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Detection Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Fall Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Monitor for sudden impacts and falls
                </p>
              </div>
              <Switch
                checked={settings.fallDetectionEnabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, fallDetectionEnabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Distress Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Monitor heart rate for signs of distress
                </p>
              </div>
              <Switch
                checked={settings.distressDetectionEnabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, distressDetectionEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Threshold Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Health Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="heartrate">Heart Rate Threshold (BPM)</Label>
              <Input
                id="heartrate"
                type="number"
                min="80"
                max="200"
                value={settings.heartRateThreshold}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, heartRateThreshold: parseInt(e.target.value) || 120 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Alert when heart rate exceeds this value
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Alert Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="countdown">Alert Countdown (seconds)</Label>
              <Input
                id="countdown"
                type="number"
                min="5"
                max="60"
                value={settings.countdownDuration}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, countdownDuration: parseInt(e.target.value) || 15 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Time to cancel alert before emergency contacts are notified
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Emergency Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Auto-Call Emergency Services</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically call emergency number if no response
                </p>
              </div>
              <Switch
                checked={settings.autoCallEnabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, autoCallEnabled: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Number</Label>
              <Input
                id="emergency"
                type="tel"
                value={settings.emergencyNumber}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, emergencyNumber: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Primary emergency contact number
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={handleSave} className="flex-1">
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>

        {/* Warning */}
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              ⚠️ These settings affect emergency response behavior. Test thoroughly 
              before relying on this system. This is not a medical device.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigureSettings;