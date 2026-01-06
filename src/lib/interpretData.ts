// Data interpretation utilities for chart rendering

export interface ChartData {
  headers: string[];
  data: Record<string, string | number>[];
}

export interface ChartPoint {
  label: string;
  value: number;
  series?: string;
}

export interface LegendItem {
  label: string;
  color: string;
}

export function interpretData(data: ChartData): {
  chartPoints: ChartPoint[];
  legend: LegendItem[];
  isMultiSeries: boolean;
  categoryHeader: string;
} {
  // Handle case with insufficient data
  if (!data || data.headers.length < 2 || !data.data.length) {
    return {
      chartPoints: [],
      legend: [],
      isMultiSeries: false,
      categoryHeader: "",
    };
  }

  // Simple case: Category,Value (like Branch,Solid)
  if (data.headers.length === 2) {
    const chartPoints = data.data.map((row) => ({
      label: String(row[data.headers[0]!] || ""),
      value: Number(row[data.headers[1]!]) || 0,
    }));

    return {
      chartPoints,
      legend: [],
      isMultiSeries: false,
      categoryHeader: data.headers[0] || "",
    };
  }

  // Multi-series case: Branch,Solid,Astro or Branch,Implementation,req/sec
  const categoryHeader = data.headers[0] || "";
  const valueHeaders = data.headers.slice(1);

  // Group by category
  const categories = Array.from(
    new Set(data.data.map((row) => String(row[categoryHeader as keyof typeof row] || ""))),
  );

  // Define colors for different series
  const colors = ["#007acc", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];
  const seriesColors = colors.slice(0, valueHeaders.length);

  // Create legend
  const legend = valueHeaders.map((header, index) => ({
    label: header,
    color: seriesColors[index] || "#007acc",
  }));

  // Flatten data for grouped bar chart
  const chartPoints: ChartPoint[] = [];
  categories.forEach((category) => {
    valueHeaders.forEach((valueHeader) => {
      const row = data.data.find(
        (r) => String(r[categoryHeader as keyof typeof r] || "") === category,
      );
      if (row && valueHeader in row) {
        chartPoints.push({
          label: category,
          value: Number(row[valueHeader]) || 0,
          series: valueHeader,
        });
      }
    });
  });

  return {
    chartPoints,
    legend,
    isMultiSeries: true,
    categoryHeader,
  };
}

export function getCategories(data: ChartData): string[] {
  if (!data || !data.headers.length) return [];
  const categoryHeader = data.headers[0];
  return Array.from(
    new Set(data.data.map((row) => String(row[categoryHeader as keyof typeof row] || ""))),
  );
}

export function getValueHeaders(data: ChartData): string[] {
  if (!data || data.headers.length <= 1) return [];
  return data.headers.slice(1);
}

export function isMultiSeriesData(data: ChartData): boolean {
  return data.headers.length > 2;
}
