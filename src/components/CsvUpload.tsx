import { createSignal } from "solid-js";

import { parseCSV } from "../lib/csv";

interface ChartData {
  headers: string[];
  data: Record<string, string | number>[];
}

interface CsvUploadProps {
  onDataLoaded: (data: ChartData) => void;
}

export default function CsvUpload(props: CsvUploadProps) {
  const [isDragOver, setIsDragOver] = createSignal(false);

  const handleFile = (file: File) => {
    if (file.type !== "text/csv") return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      try {
        const data = parseCSV(csvText);
        props.onDataLoaded(data);
      } catch (error) {
        console.error("Failed to parse CSV:", error);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      class={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300 ${
        isDragOver()
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <div class="flex flex-col items-center space-y-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="text-gray-400"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <h3 class="text-xl font-semibold text-gray-700">Drop CSV file here</h3>
        <p class="text-gray-500">or click to select</p>
        <input
          type="file"
          id="file-input"
          accept=".csv"
          class="hidden"
          onChange={handleFileInput}
        />
      </div>
    </div>
  );
}
