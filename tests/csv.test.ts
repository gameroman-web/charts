import { describe, it, expect } from "bun:test";

import { parseCSV } from "../src/lib/csv.ts";

describe("CSV Parser", () => {
  it("should parse simple CSV data", () => {
    const csvText = "label,value\nApple,10\nBanana,15\nOrange,8";
    const result = parseCSV(csvText);

    expect(result.headers).toEqual(["label", "value"]);
    expect(result.data).toEqual([
      { label: "Apple", value: 10 },
      { label: "Banana", value: 15 },
      { label: "Orange", value: 8 },
    ]);
  });

  it("should handle CSV with mixed data types", () => {
    const csvText = "product,price,category\nApple,1.50,Fruit\nBook,12.99,Education";
    const result = parseCSV(csvText);

    expect(result.data).toEqual([
      { product: "Apple", price: 1.5, category: "Fruit" },
      { product: "Book", price: 12.99, category: "Education" },
    ]);
  });

  it("should handle empty CSV", () => {
    const csvText = "";
    const result = parseCSV(csvText);

    expect(result.headers).toEqual([]);
    expect(result.data).toEqual([]);
  });

  it("should handle single row CSV", () => {
    const csvText = "header1,header2";
    const result = parseCSV(csvText);

    expect(result.headers).toEqual(["header1", "header2"]);
    expect(result.data).toEqual([]);
  });
});
