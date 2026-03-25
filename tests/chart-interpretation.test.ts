import { describe, expect, it } from "bun:test";

import {
  type ChartData,
  getCategories,
  getValueHeaders,
  interpretData,
  isMultiSeriesData,
} from "#lib/interpret-data";

// Test data interpretation logic (separate from CSV parsing)
describe("Chart Data Interpretation", () => {
  describe("interpretData function", () => {
    it("should handle simple two-column CSV data", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Solid"],
        data: [
          { Branch: "main", Solid: 32 },
          { Branch: "jg", Solid: 32 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(false);
      expect(result.categoryHeader).toBe("Branch");
      expect(result.valueHeader).toBe("Solid");
      expect(result.legend).toEqual([]);
      expect(result.chartPoints).toEqual([
        { label: "main", value: 32 },
        { label: "jg", value: 32 },
      ]);
    });

    it("should handle three-column tabular CSV data", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Solid", "Astro"],
        data: [
          { Branch: "main", Solid: 32, Astro: 8 },
          { Branch: "jg", Solid: 32, Astro: 18 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Branch");
      expect(result.valueHeader).toBe("Solid");
      expect(result.legend).toEqual([
        { label: "Solid", color: "#007acc" },
        { label: "Astro", color: "#ff6b6b" },
      ]);

      // Check chart points structure
      expect(result.chartPoints).toHaveLength(4); // 2 categories × 2 series
      expect(result.chartPoints.filter((p) => p.label === "main")).toHaveLength(
        2,
      );
      expect(result.chartPoints.filter((p) => p.label === "jg")).toHaveLength(
        2,
      );

      // Check specific values
      const mainSolid = result.chartPoints.find(
        (p) => p.label === "main" && p.series === "Solid",
      );
      const mainAstro = result.chartPoints.find(
        (p) => p.label === "main" && p.series === "Astro",
      );
      expect(mainSolid?.value).toBe(32);
      expect(mainAstro?.value).toBe(8);
    });

    it("should handle expanded three-column format", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Implementation", "req/sec"],
        data: [
          { Branch: "main", Implementation: "Solid", "req/sec": 32 },
          { Branch: "main", Implementation: "Astro", "req/sec": 8 },
          { Branch: "jg", Implementation: "Solid", "req/sec": 32 },
          { Branch: "jg", Implementation: "Astro", "req/sec": 18 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Branch");
      expect(result.valueHeader).toBe("req/sec");
      expect(result.legend).toEqual([
        { label: "Solid", color: "#007acc" },
        { label: "Astro", color: "#ff6b6b" },
      ]);
      expect(result.chartPoints).toHaveLength(4);
    });

    it("should handle four-column data correctly", () => {
      const csvData: ChartData = {
        headers: ["Version", "Framework", "Metric1", "Metric2"],
        data: [
          { Version: "v1", Framework: "Solid", Metric1: 100, Metric2: 85 },
          { Version: "v1", Framework: "Astro", Metric1: 120, Metric2: 95 },
          { Version: "v2", Framework: "Solid", Metric1: 110, Metric2: 90 },
          { Version: "v2", Framework: "Astro", Metric1: 130, Metric2: 100 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Version");
      expect(result.valueHeader).toBe("Metric1");
      expect(result.legend).toEqual([
        { label: "Metric1", color: "#007acc" },
        { label: "Metric2", color: "#ff6b6b" },
      ]);
      expect(result.chartPoints).toHaveLength(4); // 2 versions × 2 series (Metric1, Metric2)

      // Verify specific chartPoints mapping
      const v1Metric1 = result.chartPoints.find(
        (p) => p.label === "v1" && p.series === "Metric1",
      );
      const v1Metric2 = result.chartPoints.find(
        (p) => p.label === "v1" && p.series === "Metric2",
      );
      const v2Metric2 = result.chartPoints.find(
        (p) => p.label === "v2" && p.series === "Metric2",
      );

      expect(v1Metric1).toEqual({
        label: "v1",
        value: 100,
        series: "Metric1",
      });
      expect(v1Metric2).toEqual({
        label: "v1",
        value: 85,
        series: "Metric2",
      });
      expect(v2Metric2).toEqual({
        label: "v2",
        value: 90,
        series: "Metric2",
      });
    });

    it("should handle missing values gracefully", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Solid", "Astro"],
        data: [
          { Branch: "main", Solid: 32, Astro: 8 },
          { Branch: "jg", Solid: 0, Astro: 18 }, // Missing Solid value as 0
          { Branch: "feature", Solid: 25, Astro: 0 }, // Missing Astro value as 0
        ],
      };

      const result = interpretData(csvData);

      expect(result.chartPoints).toHaveLength(6);

      // Check that missing values are treated as 0
      const jgSolid = result.chartPoints.find(
        (p) => p.label === "jg" && p.series === "Solid",
      );
      const featureAstro = result.chartPoints.find(
        (p) => p.label === "feature" && p.series === "Astro",
      );
      expect(jgSolid?.value).toBe(0);
      expect(featureAstro?.value).toBe(0);
    });

    it("should handle empty or insufficient data", () => {
      const emptyData: ChartData = {
        headers: [],
        data: [],
      };

      const result = interpretData(emptyData);

      expect(result.chartPoints).toEqual([]);
      expect(result.legend).toEqual([]);
      expect(result.isMultiSeries).toBe(false);
      expect(result.categoryHeader).toBe("");
      expect(result.valueHeader).toBe("");
    });

    it("should create legend with proper colors", () => {
      const csvData: ChartData = {
        headers: [
          "Test",
          "ResultA",
          "ResultB",
          "ResultC",
          "ResultD",
          "ResultE",
        ],
        data: [
          {
            Test: "test1",
            ResultA: 10,
            ResultB: 15,
            ResultC: 8,
            ResultD: 12,
            ResultE: 7,
          },
        ],
      };

      const result = interpretData(csvData);

      expect(result.legend).toEqual([
        { label: "ResultA", color: "#007acc" },
        { label: "ResultB", color: "#ff6b6b" },
        { label: "ResultC", color: "#4ecdc4" },
        { label: "ResultD", color: "#45b7d1" },
        { label: "ResultE", color: "#96ceb4" },
      ]);
    });
  });

  describe("Utility functions", () => {
    it("getCategories should extract unique categories", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Value1", "Value2"],
        data: [
          { Branch: "main", Value1: 10, Value2: 20 },
          { Branch: "main", Value1: 15, Value2: 25 },
          { Branch: "feature", Value1: 8, Value2: 12 },
        ],
      };

      const categories = getCategories(csvData);

      expect(categories).toEqual(["main", "feature"]);
    });

    it("getValueHeaders should extract value column headers", () => {
      const csvData: ChartData = {
        headers: ["Version", "Metric1", "Metric2", "Metric3"],
        data: [],
      };

      const valueHeaders = getValueHeaders(csvData);

      expect(valueHeaders).toEqual(["Metric1", "Metric2", "Metric3"]);
    });

    it("isMultiSeriesData should detect multi-series correctly", () => {
      const simpleData: ChartData = {
        headers: ["Category", "Value"],
        data: [],
      };

      const multiSeriesData: ChartData = {
        headers: ["Category", "Series1", "Series2"],
        data: [],
      };

      expect(isMultiSeriesData(simpleData)).toBe(false);
      expect(isMultiSeriesData(multiSeriesData)).toBe(true);
    });

    it("utility functions should handle empty data", () => {
      const emptyData: ChartData = {
        headers: [],
        data: [],
      };

      expect(getCategories(emptyData)).toEqual([]);
      expect(getValueHeaders(emptyData)).toEqual([]);
      expect(isMultiSeriesData(emptyData)).toBe(false);
    });
  });

  describe("Color consistency", () => {
    it("legend colors should match BarChart hardcoded colors", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Solid", "Astro", "React"],
        data: [{ Branch: "main", Solid: 10, Astro: 20, React: 30 }],
      };

      const result = interpretData(csvData);

      const barChartColors = [
        "#007acc",
        "#ff6b6b",
        "#4ecdc4",
        "#45b7d1",
        "#96ceb4",
      ];

      result.legend.forEach((item, index) => {
        expect(item.color).toBe(barChartColors[index] ?? "#007acc");
      });
    });

    it("series color mapping should be consistent between legend and chartPoints", () => {
      const csvData: ChartData = {
        headers: ["Version", "A", "B", "C"],
        data: [
          { Version: "v1", A: 10, B: 20, C: 30 },
          { Version: "v2", A: 15, B: 25, C: 35 },
        ],
      };

      const result = interpretData(csvData);

      // Legend colors should match the colors that would be assigned to series in chartPoints
      result.legend.forEach((legendItem) => {
        const chartPointsForSeries = result.chartPoints.filter(
          (p) => p.series === legendItem.label,
        );
        expect(chartPointsForSeries.length).toBeGreaterThan(0);
      });
    });
  });

  describe("CSV format interpretation tests", () => {
    it("should interpret CSV 1: Branch,Category,Value format (pivot)", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Category", "Value"],
        data: [
          { Branch: "main", Category: "Solid", Value: 30 },
          { Branch: "main", Category: "Astro", Value: 20 },
          { Branch: "dev", Category: "Solid", Value: 32 },
          { Branch: "dev", Category: "Astro", Value: 40 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Branch");
      expect(result.valueHeader).toBe("Value");
      expect(result.legend).toEqual([
        { label: "Solid", color: "#007acc" },
        { label: "Astro", color: "#ff6b6b" },
      ]);
      expect(result.chartPoints).toHaveLength(4);

      const mainSolid = result.chartPoints.find(
        (p) => p.label === "main" && p.series === "Solid",
      );
      const devAstro = result.chartPoints.find(
        (p) => p.label === "dev" && p.series === "Astro",
      );
      expect(mainSolid?.value).toBe(30);
      expect(devAstro?.value).toBe(40);
    });

    it("should interpret CSV 2: Branch,Solid,Astro format (tabular)", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Solid", "Astro"],
        data: [
          { Branch: "main", Solid: 30, Astro: 20 },
          { Branch: "dev", Solid: 32, Astro: 40 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Branch");
      expect(result.valueHeader).toBe("Solid");
      expect(result.legend).toEqual([
        { label: "Solid", color: "#007acc" },
        { label: "Astro", color: "#ff6b6b" },
      ]);
      expect(result.chartPoints).toHaveLength(4);

      const mainSolid = result.chartPoints.find(
        (p) => p.label === "main" && p.series === "Solid",
      );
      const devAstro = result.chartPoints.find(
        (p) => p.label === "dev" && p.series === "Astro",
      );
      expect(mainSolid?.value).toBe(30);
      expect(devAstro?.value).toBe(40);
    });

    it("should interpret CSV 3: Branch,Solid,Astro,React format", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Solid", "Astro", "React"],
        data: [
          { Branch: "main", Solid: 30, Astro: 20, React: 25 },
          { Branch: "dev", Solid: 32, Astro: 40, React: 35 },
          { Branch: "staging", Solid: 28, Astro: 22, React: 24 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Branch");
      expect(result.valueHeader).toBe("Solid");
      expect(result.legend).toEqual([
        { label: "Solid", color: "#007acc" },
        { label: "Astro", color: "#ff6b6b" },
        { label: "React", color: "#4ecdc4" },
      ]);
      expect(result.chartPoints).toHaveLength(9);

      const stagingReact = result.chartPoints.find(
        (p) => p.label === "staging" && p.series === "React",
      );
      expect(stagingReact?.value).toBe(24);
    });

    it("should interpret CSV 4: Branch,Framework,Bundle_Size format (pivot with decimals)", () => {
      const csvData: ChartData = {
        headers: ["Branch", "Framework", "Bundle_Size"],
        data: [
          { Branch: "production", Framework: "Solid", Bundle_Size: 12.5 },
          { Branch: "production", Framework: "Astro", Bundle_Size: 14.2 },
          { Branch: "production", Framework: "React", Bundle_Size: 45.0 },
          { Branch: "production", Framework: "Vue", Bundle_Size: 32.1 },
          { Branch: "development", Framework: "Solid", Bundle_Size: 13.0 },
          { Branch: "development", Framework: "Astro", Bundle_Size: 15.5 },
          { Branch: "development", Framework: "React", Bundle_Size: 48.2 },
          { Branch: "development", Framework: "Vue", Bundle_Size: 34.0 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Branch");
      expect(result.valueHeader).toBe("Bundle_Size");
      expect(result.legend).toEqual([
        { label: "Solid", color: "#007acc" },
        { label: "Astro", color: "#ff6b6b" },
        { label: "React", color: "#4ecdc4" },
        { label: "Vue", color: "#45b7d1" },
      ]);
      expect(result.chartPoints).toHaveLength(8);

      const prodReact = result.chartPoints.find(
        (p) => p.label === "production" && p.series === "React",
      );
      const devVue = result.chartPoints.find(
        (p) => p.label === "development" && p.series === "Vue",
      );
      expect(prodReact?.value).toBe(45.0);
      expect(devVue?.value).toBe(34.0);
    });

    it("should interpret CSV 5: Module,Baseline,Optimized format", () => {
      const csvData: ChartData = {
        headers: ["Module", "Baseline", "Optimized"],
        data: [
          { Module: "Auth", Baseline: 120, Optimized: 85 },
          { Module: "DB_Query", Baseline: 450, Optimized: 310 },
          { Module: "UI_Render", Baseline: 300, Optimized: 290 },
          { Module: "API_Call", Baseline: 150, Optimized: 145 },
          { Module: "Storage", Baseline: 80, Optimized: 40 },
          { Module: "Logging", Baseline: 50, Optimized: 48 },
          { Module: "Crypto", Baseline: 600, Optimized: 420 },
          { Module: "Assets", Baseline: 210, Optimized: 195 },
        ],
      };

      const result = interpretData(csvData);

      expect(result.isMultiSeries).toBe(true);
      expect(result.categoryHeader).toBe("Module");
      expect(result.valueHeader).toBe("Baseline");
      expect(result.legend).toEqual([
        { label: "Baseline", color: "#007acc" },
        { label: "Optimized", color: "#ff6b6b" },
      ]);
      expect(result.chartPoints).toHaveLength(16);

      const cryptoBaseline = result.chartPoints.find(
        (p) => p.label === "Crypto" && p.series === "Baseline",
      );
      const storageOptimized = result.chartPoints.find(
        (p) => p.label === "Storage" && p.series === "Optimized",
      );
      expect(cryptoBaseline?.value).toBe(600);
      expect(storageOptimized?.value).toBe(40);
    });
  });
});
