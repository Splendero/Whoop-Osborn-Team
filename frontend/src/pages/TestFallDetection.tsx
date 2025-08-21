import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TestFallDetection = () => {
  const navigate = useNavigate();
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'detecting' | 'success' | 'failed'>('idle');

  const runFallTest = () => {
    setIsSimulating(true);
    setTestResult('detecting');
    
    // Simulate detection process
    setTimeout(() => {
      setTestResult('success');
      setIsSimulating(false);
    }, 3000);
  };

  const resetTest = () => {
    setTestResult('idle');
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
          <h1 className="text-2xl font-bold">Test Fall Detection</h1>
          <p className="text-muted-foreground text-sm">Simulate emergency scenarios</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Fall Detection Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              {testResult === 'idle' && (
                <>
                  <p className="text-muted-foreground">
                    Click the button below to simulate a fall detection event.
                    This will test the emergency alert system.
                  </p>
                  <Button onClick={runFallTest} className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Simulate Fall
                  </Button>
                </>
              )}

              {testResult === 'detecting' && (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <Badge variant="destructive" className="text-sm">
                      Detecting fall pattern...
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Analyzing motion data and acceleration patterns
                  </div>
                </div>
              )}

              {testResult === 'success' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-medium">Fall Detection Successful</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Emergency alert would be triggered in a real scenario
                  </p>
                  <Button variant="outline" onClick={resetTest}>
                    Run Another Test
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning text-sm">Safety Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              This is a simulation for testing purposes only. Do not rely on this 
              system for actual emergency situations. Always ensure proper medical 
              devices and emergency contacts are in place.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestFallDetection;