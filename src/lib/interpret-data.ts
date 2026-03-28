type ChartDataData = Record<string, string | number>[];

export interface ChartData {
  headers: string[];
  data: ChartDataData;
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

interface MultiSeriesData {
  headers: [string, string, string, ...string[]];
  data: ChartDataData;
}

const COLORS = ["#007acc", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];

type Format =
  | {
      readonly isLong: false;
      readonly isLabeled: false;
      readonly seriesStartIndex: 1;
      readonly valueHeader: string;
      readonly labelHeader?: never;
    }
  | {
      readonly isLong: true;
      readonly isLabeled: true;
      readonly seriesStartIndex: 1;
      readonly valueHeader: string;
      readonly labelHeader: string;
    }
  | {
      readonly isLong: false;
      readonly isLabeled: true;
      readonly seriesStartIndex: 2;
      readonly valueHeader: string;
      readonly labelHeader: string;
    };

function getFormat(data: MultiSeriesData): Format {
  const isLabeled = data.data.every(
    (row) => typeof row[data.headers[1]] === "string",
  );

  if (!isLabeled) {
    return {
      isLong: false,
      isLabeled,
      seriesStartIndex: 1,
      valueHeader: data.headers[1],
    } as const;
  }

  const isLong = data.headers.length === 3;
  const labelHeader = data.headers[1];
  const valueHeader = data.headers[2];

  if (isLong) {
    return {
      isLong,
      isLabeled,
      seriesStartIndex: 1,
      valueHeader,
      labelHeader,
    } as const;
  }

  return {
    isLong,
    isLabeled,
    seriesStartIndex: 2,
    valueHeader,
    labelHeader,
  } as const;
}

function buildLegend(seriesList: string[]): LegendItem[] {
  return seriesList.map((name, index) => ({
    label: name,
    color: COLORS[index] ?? "#007acc",
  }));
}

export function getCategories(data: ChartData): string[] {
  if (!data.headers.length) return [];
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

export function isMultiSeriesData(data: ChartData): data is MultiSeriesData {
  return data.headers.length >= 3;
}

function hasData(data: ChartData): data is {
  headers: [string, string, ...string[]];
  data: ChartDataData;
} {
  if (!data.data.length) {
    return false;
  }
  return data.headers.length >= 2;
}

function getUniqueByHeader(data: ChartDataData, header: string): string[] {
  return [...new Set(data.map((r) => String(r[header] ?? "")))];
}

function getChartPoints(
  data: MultiSeriesData,
  format: Format,
  seriesList: string[],
  categoryHeader: string,
) {
  const chartPoints: ChartPoint[] = [];

  const categories = getUniqueByHeader(data.data, categoryHeader);

  categories.forEach((category) => {
    seriesList.forEach((seriesName) => {
      const value =
        Number(
          format.isLong
            ? data.data.find(
                (r) =>
                  r[categoryHeader] === category &&
                  r[format.labelHeader] === seriesName,
              )?.[format.valueHeader]
            : data.data.find((r) => r[categoryHeader] === category)?.[
                seriesName
              ],
        ) || 0;

      chartPoints.push({ label: category, value, series: seriesName });
    });
  });

  return chartPoints;
}

export function interpretData(data: ChartData): {
  chartPoints: ChartPoint[];
  legend: LegendItem[];
  isMultiSeries: boolean;
  categoryHeader: string;
  valueHeader: string;
} {
  if (!hasData(data)) {
    return {
      chartPoints: [],
      legend: [],
      isMultiSeries: false,
      categoryHeader: "",
      valueHeader: "",
    };
  }

  const categoryHeader = data.headers[0];

  if (!isMultiSeriesData(data)) {
    const valueHeader = data.headers[1];
    const chartPoints = data.data.map((row) => ({
      label: String(row[categoryHeader]),
      value: Number(row[valueHeader]) || 0,
    }));
    return {
      chartPoints,
      legend: [],
      isMultiSeries: false,
      categoryHeader,
      valueHeader,
    };
  }

  const format = getFormat(data);

  const seriesList = format.isLong
    ? getUniqueByHeader(data.data, format.labelHeader)
    : data.headers.slice(format.seriesStartIndex);

  const chartPoints = getChartPoints(data, format, seriesList, categoryHeader);

  return {
    chartPoints,
    legend: buildLegend(seriesList),
    isMultiSeries: true,
    categoryHeader,
    valueHeader: format.valueHeader,
  };
}
