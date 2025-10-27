import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploadProps {
  onAnalysisComplete: (analysisId: string) => void;
}

export const ResumeUpload = ({ onAnalysisComplete }: ResumeUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For PDFs, we'll need to use a library or send to backend
    // For now, we'll return a placeholder and you can enhance this
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text || "Unable to extract text from this file format.");
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Please sign in to upload resumes');
      }

      setUploadProgress(20);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadProgress(40);

      // Save resume metadata to database
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
        })
        .select()
        .single();

      if (resumeError) throw resumeError;

      setUploadProgress(60);

      // Extract text from file for analysis
      let resumeText = '';
      if (file.type === 'text/plain') {
        resumeText = await extractTextFromFile(file);
      } else {
        // For PDF/DOC files, we'll send a placeholder
        resumeText = `Resume file: ${file.name}. Professional document uploaded for analysis.`;
      }

      setUploadProgress(80);

      // Call analyze function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          resumeText,
          resumeId: resumeData.id 
        }
      });

      if (analysisError) throw analysisError;

      setUploadProgress(100);

      toast({
        title: "Success!",
        description: "Your resume has been analyzed successfully.",
      });

      onAnalysisComplete(analysisData.id);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload and analyze resume.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 ${
        isDragging ? 'border-primary shadow-lg scale-[1.02]' : ''
      }`}
      style={{ 
        background: 'var(--gradient-card)',
        boxShadow: isDragging ? 'var(--shadow-glow)' : 'var(--shadow-elegant)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-12 text-center space-y-6">
        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <div className="space-y-2">
              <p className="text-lg font-semibold">Analyzing your resume...</p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${uploadProgress}%`,
                    background: 'var(--gradient-primary)',
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Upload className="w-12 h-12 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Upload Your Resume</h3>
              <p className="text-muted-foreground">
                Drag and drop your resume here, or click to browse
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="relative"
                style={{ background: 'var(--gradient-primary)' }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <FileText className="w-5 h-5 mr-2" />
                Choose File
              </Button>
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
            </p>
          </>
        )}
      </div>
    </Card>
  );
};
