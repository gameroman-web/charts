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
  valueHeader: string;
} {
  // Handle case with insufficient data
  if (!data || data.headers.length < 2 || !data.data.length) {
    return {
      chartPoints: [],
      legend: [],
      isMultiSeries: false,
      categoryHeader: "",
      valueHeader: "",
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
      valueHeader: data.headers[1] || "",
    };
  }

  // Multi-series case: Branch,Solid,Astro or Branch,Implementation,req/sec
  const categoryHeader = data.headers[0] || "";

  // Check if this is a pivot format:
  // - 3 columns: Branch,Implementation,req/sec (2nd col = series names, 3rd = values)
  // - 4+ columns: Version,Framework,Metric1,Metric2 (2nd = series names, rest = values)
  const isPivotFormat =
    data.headers.length >= 3 &&
    data.data.length > 0 &&
    data.data.every((row) => {
      const secondCol = row[data.headers[1]!];
      return typeof secondCol === "string";
    });

  let legend: LegendItem[] = [];
  const chartPoints: ChartPoint[] = [];

  if (isPivotFormat) {
    // Handle pivot format: Branch,Implementation,req/sec OR Version,Framework,Metric1,Metric2
    const seriesHeader = data.headers[1]!;
    const valueHeaders = data.headers.slice(2); // Multiple value columns for 4+ format

    // Get unique series names
    const seriesNames = Array.from(
      new Set(data.data.map((row) => String(row[seriesHeader] || ""))),
    );

    // Get categories
    const categories = Array.from(
      new Set(data.data.map((row) => String(row[categoryHeader] || ""))),
    );

    // Define colors
    const colors = ["#007acc", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];
    const seriesColors = colors.slice(0, seriesNames.length);

    // Create legend - use value headers as series names (for 4+ columns) or series names (for 3 columns)
    const seriesList = data.headers.length === 3 ? seriesNames : valueHeaders;
    legend = seriesList.map((name, index) => ({
      label: name,
      color: seriesColors[index] || "#007acc",
    }));

    // Create chart points
    categories.forEach((category) => {
      seriesList.forEach((seriesName) => {
        const row = data.data.find(
          (r) => String(r[categoryHeader] || "") === category,
        );
        chartPoints.push({
          label: category,
          value: Number(row?.[seriesName]) || 0,
          series: seriesName,
        });
      });
    });
  } else {
    // Handle tabular format: Branch,Solid,Astro
    const valueHeaders = data.headers.slice(1);

    // Group by category
    const categories = Array.from(
      new Set(data.data.map((row) => String(row[categoryHeader] || ""))),
    );

    // Define colors for different series
    const colors = ["#007acc", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];
    const seriesColors = colors.slice(0, valueHeaders.length);

    // Create legend
    legend = valueHeaders.map((header, index) => ({
      label: header,
      color: seriesColors[index] || "#007acc",
    }));

    // Flatten data for grouped bar chart
    categories.forEach((category) => {
      valueHeaders.forEach((valueHeader) => {
        const row = data.data.find(
          (r) => String(r[categoryHeader] || "") === category,
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
  }

  // Determine the appropriate value header for Y-axis label
  const valueHeader = isPivotFormat
    ? (data.headers[2] ?? "Values")
    : data.headers[1] || "Values";

  return {
    chartPoints,
    legend,
    isMultiSeries: true,
    categoryHeader,
    valueHeader,
  };
}

export function getCategories(data: ChartData): string[] {
  if (!data || !data.headers.length) return [];
  const categoryHeader = data.headers[0];
  return Array.from(
    new Set(
      data.data.map((row) =>
        String(row[categoryHeader as keyof typeof row] || ""),
      ),
    ),
  );
}

export function getValueHeaders(data: ChartData): string[] {
  if (!data || data.headers.length <= 1) return [];
  return data.headers.slice(1);
}

export function isMultiSeriesData(data: ChartData): boolean {
  return data.headers.length > 2;
}

export function getSeriesCount(data: ChartData): number {
  if (!data || data.headers.length < 3) return 0;
  return data.headers.length - 1;
}
