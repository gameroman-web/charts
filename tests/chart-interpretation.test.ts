import { describe, it, expect } from "bun:test";

import {
  interpretData,
  getCategories,
  getValueHeaders,
  isMultiSeriesData,
  type ChartData,
} from "../src/lib/interpretData";

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
      expect(result.legend).toEqual([
        { label: "Solid", color: "#007acc" },
        { label: "Astro", color: "#ff6b6b" },
      ]);

      // Check chart points structure
      expect(result.chartPoints).toHaveLength(4); // 2 categories × 2 series
      expect(result.chartPoints.filter((p) => p.label === "main")).toHaveLength(2);
      expect(result.chartPoints.filter((p) => p.label === "jg")).toHaveLength(2);

      // Check specific values
      const mainSolid = result.chartPoints.find((p) => p.label === "main" && p.series === "Solid");
      const mainAstro = result.chartPoints.find((p) => p.label === "main" && p.series === "Astro");
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
      expect(result.legend).toEqual([
        { label: "Implementation", color: "#007acc" },
        { label: "req/sec", color: "#ff6b6b" },
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
      expect(result.legend).toEqual([
        { label: "Framework", color: "#007acc" },
        { label: "Metric1", color: "#ff6b6b" },
        { label: "Metric2", color: "#4ecdc4" },
      ]);
      expect(result.chartPoints).toHaveLength(6); // 2 versions × 3 series
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
      const jgSolid = result.chartPoints.find((p) => p.label === "jg" && p.series === "Solid");
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
    });

    it("should create legend with proper colors", () => {
      const csvData: ChartData = {
        headers: ["Test", "ResultA", "ResultB", "ResultC", "ResultD", "ResultE"],
        data: [{ Test: "test1", ResultA: 10, ResultB: 15, ResultC: 8, ResultD: 12, ResultE: 7 }],
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
});
