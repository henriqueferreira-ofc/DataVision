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
import * as XLSX from "xlsx";

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

async function extractFileContent(file: File): Promise<string> {
  // CSV files
  if (file.type === "text/csv" || file.name.endsWith(".csv")) {
    return file.text();
  }

  // Excel files - parse with SheetJS
  if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.type.includes("spreadsheet")) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    let allContent = "";
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      allContent += `=== Sheet: ${sheetName} ===\n${csv}\n\n`;
    }
    return allContent;
  }

  // PDF and PPTX - extract what we can from binary
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
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
      toast({ variant: "destructive", title: "Error", description: language === "pt-BR" ? "Formato de arquivo não suportado" : "Unsupported file format" });
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
  }, [toast, language]);

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
        // 1. Upload file to storage (sanitize filename to avoid "Invalid key")
        const safeName = file.name
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
          .replace(/[^a-zA-Z0-9._-]/g, "_"); // replace special chars
        const filePath = `${user.id}/${Date.now()}_${safeName}`;
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

        // 3. Extract file content (properly parse xlsx)
        const fileContent = await extractFileContent(file);
        console.log(`Extracted ${fileContent.length} chars from ${file.name}`);

        // 4. Trigger AI analysis
        const { error: fnError } = await supabase.functions.invoke("analyze-data", {
          body: {
            analysisId: analysis.id,
            fileContent,
            fileName: file.name,
            language,
          },
        });

        if (fnError) {
          console.error("Analysis function error:", fnError);
          toast({
            variant: "destructive",
            title: "Error",
            description: language === "pt-BR" ? "Erro ao analisar arquivo" : "Error analyzing file",
          });
        } else {
          toast({
            title: language === "pt-BR" ? "Análise concluída!" : "Analysis complete!",
            description: language === "pt-BR"
              ? `${file.name} foi analisado com sucesso`
              : `${file.name} was analyzed successfully`,
          });
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload or analyze the file. Please try again.",
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
          input.accept = ".xlsx,.xls,.csv,.pdf,.pptx";
          input.onchange = (e) => {
            const el = e.target as HTMLInputElement;
            if (el.files) handleFiles(el.files);
          };
          input.click();
        }}
      >
        <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-base font-medium sm:text-lg">{t.dashboard.uploadSubtitle}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.dashboard.uploadFormats}</p>
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
                <CardContent className="flex items-center gap-3 py-4 sm:gap-4">
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
