import React from "react";
import { Download, Upload } from "lucide-react";

interface ImportExportButtonsProps {
  onImport: (data: string) => void;
  onExport: () => void;
}

function ImportExportButtons({ onImport, onExport }: ImportExportButtonsProps) {
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onImport(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="absolute bottom-4 right-4 flex gap-2">
      <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
        <Upload className="w-4 h-4" />
        Import
        <input
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </label>
      <button
        onClick={onExport}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
    </div>
  );
}

export default ImportExportButtons;
