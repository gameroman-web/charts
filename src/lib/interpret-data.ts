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
  const categories = [
    ...new Set(data.data.map((r) => String(r[categoryHeader] ?? ""))),
  ];

  if (data.headers.length === 2) {
    return {
      chartPoints: data.data.map((row) => ({
        label: String(row[data.headers[0]] ?? ""),
        value: Number(row[data.headers[1]]) || 0,
      })),
      legend: [],
      isMultiSeries: false,
      categoryHeader: data.headers[0] ?? "",
      valueHeader: data.headers[1] ?? "",
    };
  }

  const isLongFormat =
    data.data.length > 0 &&
    data.data.every((row) => typeof row[data.headers[1]] === "string");

  const seriesList =
    isLongFormat && data.headers.length === 3
      ? [
          ...new Set(
            data.data.map((r) => String(r[data.headers[1] ?? ""] ?? "")),
          ),
        ]
      : data.headers.slice(isLongFormat ? 2 : 1);

  const valueHeader = isLongFormat
    ? (data.headers[2] ?? "Values")
    : (data.headers[1] ?? "Values");

  const chartPoints: ChartPoint[] = [];

  categories.forEach((category) => {
    seriesList.forEach((seriesName) => {
      const value =
        isLongFormat && data.headers.length === 3
          ? Number(
              data.data.find(
                (r) =>
                  r[categoryHeader] === category &&
                  r[data.headers[1]] === seriesName,
              )?.[data.headers[2]],
            ) || 0
          : Number(
              data.data.find((r) => r[categoryHeader] === category)?.[
                seriesName
              ],
            ) || 0;

      chartPoints.push({ label: category, value, series: seriesName });
    });
  });

  return {
    chartPoints,
    legend: buildLegend(seriesList),
    isMultiSeries: true,
    categoryHeader,
    valueHeader,
  };
}

export function getCategories(data: ChartData): string[] {
  if (!data || !data.headers.length) return [];
  const categoryHeader = data.headers[0];
  return [
    ...new Set(
      data.data.map((r) => String(r[categoryHeader as keyof typeof r] ?? "")),
    ),
  ];
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
