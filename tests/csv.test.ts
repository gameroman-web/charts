import { describe, expect, it } from "bun:test";

import { parseCSV } from "#lib/csv";

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
    const csvText =
      "product,price,category\nApple,1.50,Fruit\nBook,12.99,Education";
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

  it("should parse CSV with category rows (Branch, Category, Value format)", () => {
    const csvText = `Branch,Category,Value
main,Solid,30
main,Astro,20
dev,Solid,32
dev,Astro,40`;
    const result = parseCSV(csvText);

    expect(result.headers).toEqual(["Branch", "Category", "Value"]);
    expect(result.data).toEqual([
      { Branch: "main", Category: "Solid", Value: 30 },
      { Branch: "main", Category: "Astro", Value: 20 },
      { Branch: "dev", Category: "Solid", Value: 32 },
      { Branch: "dev", Category: "Astro", Value: 40 },
    ]);
  });

  it("should parse CSV with values in columns (Branch, Solid, Astro format)", () => {
    const csvText = `Branch,Solid,Astro
main,30,20
dev,32,40`;
    const result = parseCSV(csvText);

    expect(result.headers).toEqual(["Branch", "Solid", "Astro"]);
    expect(result.data).toEqual([
      { Branch: "main", Solid: 30, Astro: 20 },
      { Branch: "dev", Solid: 32, Astro: 40 },
    ]);
  });

  it("should parse CSV with multiple framework columns", () => {
    const csvText = `Branch,Solid,Astro,React
main,30,20,25
dev,32,40,35
staging,28,22,24`;
    const result = parseCSV(csvText);

    expect(result.headers).toEqual(["Branch", "Solid", "Astro", "React"]);
    expect(result.data).toEqual([
      { Branch: "main", Solid: 30, Astro: 20, React: 25 },
      { Branch: "dev", Solid: 32, Astro: 40, React: 35 },
      { Branch: "staging", Solid: 28, Astro: 22, React: 24 },
    ]);
  });

  it("should parse CSV with decimal values", () => {
    const csvText = `Branch,Framework,Bundle_Size
production,Solid,12.5
production,Astro,14.2
production,React,45.0
production,Vue,32.1
development,Solid,13.0
development,Astro,15.5
development,React,48.2
development,Vue,34.0`;
    const result = parseCSV(csvText);

    expect(result.headers).toEqual(["Branch", "Framework", "Bundle_Size"]);
    expect(result.data).toEqual([
      { Branch: "production", Framework: "Solid", Bundle_Size: 12.5 },
      { Branch: "production", Framework: "Astro", Bundle_Size: 14.2 },
      { Branch: "production", Framework: "React", Bundle_Size: 45.0 },
      { Branch: "production", Framework: "Vue", Bundle_Size: 32.1 },
      { Branch: "development", Framework: "Solid", Bundle_Size: 13.0 },
      { Branch: "development", Framework: "Astro", Bundle_Size: 15.5 },
      { Branch: "development", Framework: "React", Bundle_Size: 48.2 },
      { Branch: "development", Framework: "Vue", Bundle_Size: 34.0 },
    ]);
  });

  it("should parse CSV with all numeric columns", () => {
    const csvText = `Module,Baseline,Optimized
Auth,120,85
DB_Query,450,310
UI_Render,300,290
API_Call,150,145
Storage,80,40
Logging,50,48
Crypto,600,420
Assets,210,195`;
    const result = parseCSV(csvText);

    expect(result.headers).toEqual(["Module", "Baseline", "Optimized"]);
    expect(result.data).toEqual([
      { Module: "Auth", Baseline: 120, Optimized: 85 },
      { Module: "DB_Query", Baseline: 450, Optimized: 310 },
      { Module: "UI_Render", Baseline: 300, Optimized: 290 },
      { Module: "API_Call", Baseline: 150, Optimized: 145 },
      { Module: "Storage", Baseline: 80, Optimized: 40 },
      { Module: "Logging", Baseline: 50, Optimized: 48 },
      { Module: "Crypto", Baseline: 600, Optimized: 420 },
      { Module: "Assets", Baseline: 210, Optimized: 195 },
    ]);
  });
});
