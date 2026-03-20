import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, FileText, Presentation, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function UploadPage() {
  const { t } = useLanguage();
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback((fileList: FileList) => {
    const valid = Array.from(fileList).filter((f) => ACCEPTED_TYPES.includes(f.type) || f.name.endsWith(".csv"));
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

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
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
