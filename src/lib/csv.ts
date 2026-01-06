// CSV parsing utility
export function parseCSV(csvText: string) {
  if (!csvText.trim()) {
    return { headers: [], data: [] };
  }

  const lines = csvText.trim().split("\n");
  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]?.split(",").map((v) => v.trim()) || [];
    const row: Record<string, string | number> = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (value !== undefined) {
        row[header] = isNaN(Number(value)) ? value : Number(value);
      }
    });

    data.push(row);
  }

  return { headers, data };
}
