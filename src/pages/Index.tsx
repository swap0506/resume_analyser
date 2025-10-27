import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { ResumeUpload } from "@/components/ResumeUpload";
import { AnalysisResults } from "@/components/AnalysisResults";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (!user) {
      setShowAuth(true);
    } else {
      setShowUpload(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAnalysisId(null);
    setShowUpload(false);
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  const handleAnalysisComplete = (id: string) => {
    setAnalysisId(id);
    setShowUpload(false);
  };

  const handleNewAnalysis = () => {
    setAnalysisId(null);
    setShowUpload(true);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: 'var(--gradient-primary)' }}
            >
              RA
            </div>
            <span className="text-xl font-bold">Resume Analyzer</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {user.email}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {!showUpload && !analysisId && <Hero onGetStarted={handleGetStarted} />}
        
        {showUpload && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Upload Your Resume</h2>
                <p className="text-muted-foreground">
                  Get instant AI-powered insights to improve your resume
                </p>
              </div>
              <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
            </div>
          </div>
        )}

        {analysisId && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Analysis Results</h2>
                  <p className="text-muted-foreground">
                    Here's what we found in your resume
                  </p>
                </div>
                <Button 
                  onClick={handleNewAnalysis}
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  Analyze Another Resume
                </Button>
              </div>
              <AnalysisResults analysisId={analysisId} />
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Index;
