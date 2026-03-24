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

const COLORS = ["#007acc", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];

function getUniqueCategories(
  data: ChartData,
  categoryHeader: string,
): string[] {
  return Array.from(
    new Set(data.data.map((row) => String(row[categoryHeader] || ""))),
  );
}

function getSeriesList(data: ChartData, isLongFormat: boolean): string[] {
  if (isLongFormat && data.headers.length === 3) {
    return Array.from(
      new Set(data.data.map((row) => String(row[data.headers[1] ?? ""] || ""))),
    );
  }
  if (isLongFormat) {
    return data.headers.slice(2);
  }
  return data.headers.slice(1);
}

function buildLegend(seriesList: string[]): LegendItem[] {
  return seriesList.map((name, index) => ({
    label: name,
    color: COLORS[index] ?? "#007acc",
  }));
}

export function interpretData(data: ChartData): {
  chartPoints: ChartPoint[];
  legend: LegendItem[];
  isMultiSeries: boolean;
  categoryHeader: string;
  valueHeader: string;
} {
  if (!data || data.headers.length < 2 || !data.data.length) {
    return {
      chartPoints: [],
      legend: [],
      isMultiSeries: false,
      categoryHeader: "",
      valueHeader: "",
    };
  }

  const categoryHeader = data.headers[0] ?? "";
  const categories = getUniqueCategories(data, categoryHeader);

  if (data.headers.length === 2) {
    const chartPoints = data.data.map((row) => ({
      label: String(row[data.headers[0] ?? ""] ?? ""),
      value: Number(row[data.headers[1] ?? ""]) || 0,
    }));

    return {
      chartPoints,
      legend: [],
      isMultiSeries: false,
      categoryHeader: data.headers[0] ?? "",
      valueHeader: data.headers[1] ?? "",
    };
  }

  const isLongFormat =
    data.data.length > 0 &&
    data.data.every((row) => typeof row[data.headers[1] ?? ""] === "string");

  const seriesList = getSeriesList(data, isLongFormat);
  const legend = buildLegend(seriesList);
  const chartPoints: ChartPoint[] = [];

  const valueHeader = isLongFormat
    ? (data.headers[2] ?? "Values")
    : (data.headers[1] ?? "Values");

  categories.forEach((category) => {
    seriesList.forEach((seriesName) => {
      let value = 0;
      const row = data.data.find(
        (r) => String(r[categoryHeader] || "") === category,
      );
      if (isLongFormat) {
        if (data.headers.length === 3) {
          const match = data.data.find(
            (r) =>
              String(r[categoryHeader] || "") === category &&
              String(r[data.headers[1] ?? ""] || "") === seriesName,
          );
          value = Number(match?.[data.headers[2] ?? ""]) || 0;
        } else {
          value = Number(row?.[seriesName]) || 0;
        }
      } else {
        value = Number(row?.[seriesName]) || 0;
      }
      chartPoints.push({ label: category, value, series: seriesName });
    });
  });

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
