import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, FileText, Presentation, Loader2, CheckCircle, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function getFileIcon(type: string) {
  if (type.includes("spreadsheet") || type.includes("csv")) return FileSpreadsheet;
  if (type.includes("pdf")) return FileText;
  if (type.includes("presentation")) return Presentation;
  return FileText;
}

async function readFileAsText(file: File): Promise<string> {
  if (file.type === "text/csv" || file.name.endsWith(".csv")) {
    return file.text();
  }
  // For binary files, convert to base64 preview or just send metadata
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Try to extract readable text from first bytes
  let text = "";
  for (let i = 0; i < Math.min(bytes.length, 15000); i++) {
    const char = bytes[i];
    if (char >= 32 && char <= 126) text += String.fromCharCode(char);
    else if (char === 10 || char === 13 || char === 9) text += String.fromCharCode(char);
  }
  return text || `[Binary file: ${file.name}, size: ${file.size} bytes, type: ${file.type}]`;
}

export default function UploadPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(-1);

  const handleFiles = useCallback((fileList: FileList) => {
    const valid = Array.from(fileList).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) || f.name.endsWith(".csv")
    );
    if (valid.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Unsupported file format" });
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndAnalyze = async () => {
    if (!user || files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadingIndex(i);

      try {
        // 1. Upload file to storage
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        // 2. Create analysis record
        const { data: analysis, error: insertError } = await supabase
          .from("analyses")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || "text/csv",
            status: "pending",
          })
          .select()
          .single();
        if (insertError) throw insertError;

        // 3. Read file content
        const fileContent = await readFileAsText(file);

        // 4. Trigger AI analysis (don't await - let it process in background)
        supabase.functions.invoke("analyze-data", {
          body: {
            analysisId: analysis.id,
            fileContent,
            fileName: file.name,
            language,
          },
        }).catch((err) => console.error("Analysis error:", err));

        toast({
          title: language === "pt-BR" ? "Arquivo enviado!" : "File uploaded!",
          description: language === "pt-BR"
            ? `${file.name} está sendo analisado...`
            : `${file.name} is being analyzed...`,
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Upload failed",
        });
      }
    }

    setUploading(false);
    setUploadingIndex(-1);
    setFiles([]);
    queryClient.invalidateQueries({ queryKey: ["analyses"] });
    navigate("/dashboard/analyses");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.uploadTitle}</h1>
        <p className="mt-1 text-muted-foreground">{t.dashboard.uploadFormats}</p>
      </div>

      <Card
        className={cn(
          "cursor-pointer border-2 border-dashed transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (uploading) return;
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".xlsx,.csv,.pdf,.pptx";
          input.onchange = (e) => {
            const el = e.target as HTMLInputElement;
            if (el.files) handleFiles(el.files);
          };
          input.click();
        }}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-lg font-medium">{t.dashboard.uploadSubtitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.dashboard.uploadFormats}</p>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file, i) => {
            const Icon = getFileIcon(file.type);
            const isUploading = uploading && uploadingIndex === i;
            const isDone = uploading && uploadingIndex > i;
            return (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : isDone ? (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Button
            onClick={handleUploadAndAnalyze}
            disabled={uploading}
            className="w-full gap-2 active:scale-[0.97]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.dashboard.analyzing}
              </>
            ) : (
              <>
                {language === "pt-BR" ? "Analisar Arquivos" : "Analyze Files"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
