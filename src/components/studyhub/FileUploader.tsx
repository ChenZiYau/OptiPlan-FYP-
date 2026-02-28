import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  onUpload: (file: File) => Promise<{ source_id: string; chunk_count: number } | null>;
  uploading: boolean;
}

export function FileUploader({ onUpload, uploading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [lastResult, setLastResult] = useState<{ filename: string; chunks: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Supabase Storage limit)

  const handleFile = useCallback(async (file: File) => {
    setLastResult(null);

    // Frontend file size gate
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: `Maximum file size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      return;
    }

    try {
      const result = await onUpload(file);
      if (result) {
        setLastResult({ filename: file.name, chunks: result.chunk_count });
        toast.success('File ingested!', { description: `${result.chunk_count} chunks created from ${file.name}` });
      }
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message });
    }
  }, [onUpload]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  if (uploading) {
    return (
      <div className="rounded-xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 p-10 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-sm text-gray-400">Extracting, chunking & embedding...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-purple-500 bg-purple-500/5'
            : 'border-white/20 hover:border-purple-500/50 bg-[#18162e]'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.pptx,.ppt,.docx,.doc,.rtf,.odt,.odp"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-12 h-12 rounded-xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Drop files here to ingest</p>
        <p className="text-xs text-gray-500">PDF, PPTX, DOCX, PPT, DOC — will be chunked & embedded</p>
      </div>

      {lastResult && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/15 border border-green-500/20 text-xs text-green-300">
          <Check className="w-3.5 h-3.5" />
          <span>{lastResult.filename} — {lastResult.chunks} chunks</span>
        </div>
      )}
    </div>
  );
}
