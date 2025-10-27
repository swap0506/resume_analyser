import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResultsProps {
  analysisId: string;
}

interface Analysis {
  id: string;
  skills: any;
  experience_summary: string;
  strengths: string[];
  improvements: string[];
  ats_score: number;
  analyzed_at: string;
}

export const AnalysisResults = ({ analysisId }: AnalysisResultsProps) => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from('resume_analyses')
          .select('*')
          .eq('id', analysisId)
          .single();

        if (error) throw error;
        setAnalysis(data);
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Card className="p-6 h-32 bg-muted" />
        <Card className="p-6 h-48 bg-muted" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Analysis not found</p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* ATS Score Card */}
      <Card 
        className="relative overflow-hidden"
        style={{ 
          background: 'var(--gradient-card)',
          boxShadow: 'var(--shadow-elegant)',
        }}
      >
        <div className="p-8 text-center">
          <Award className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">ATS Compatibility Score</h3>
          <div className={`text-6xl font-bold mb-4 ${getScoreColor(analysis.ats_score)}`}>
            {analysis.ats_score}
            <span className="text-3xl">/100</span>
          </div>
          <Progress value={analysis.ats_score} className="h-3" />
          <p className="text-sm text-muted-foreground mt-4">
            {analysis.ats_score >= 80 && "Excellent! Your resume is well-optimized for ATS systems."}
            {analysis.ats_score >= 60 && analysis.ats_score < 80 && "Good! A few improvements could boost your score."}
            {analysis.ats_score < 60 && "Needs improvement. Follow the suggestions below."}
          </p>
        </div>
      </Card>

      {/* Experience Summary */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Experience Summary
        </h3>
        <p className="text-muted-foreground leading-relaxed">{analysis.experience_summary}</p>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Identified Skills</h3>
        <div className="space-y-4">
          {analysis.skills.technical.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Technical Skills</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.technical.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {analysis.skills.soft.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Soft Skills</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.soft.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.skills.certifications.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.certifications.map((cert, idx) => (
                  <Badge key={idx} className="text-sm" style={{ background: 'var(--gradient-primary)' }}>
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Strengths
          </h3>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{strength}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-5 h-5" />
            Areas for Improvement
          </h3>
          <ul className="space-y-3">
            {analysis.improvements.map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{improvement}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
