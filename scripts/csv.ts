export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const filled = rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
  const header = filled[0];
  if (!header) return [];

  const keys = header.map((key) => key.trim());
  return filled.slice(1).map((cells) => {
    const record: CsvRow = {};
    keys.forEach((key, cellIndex) => {
      if (!key) return;
      record[key] = (cells[cellIndex] ?? "").trim();
    });
    return record;
  });
}

export function pick(row: CsvRow, names: string[]): string {
  const entries = new Map(Object.keys(row).map((key) => [key.toLowerCase(), row[key] ?? ""]));
  for (const name of names) {
    const value = entries.get(name.toLowerCase());
    if (value) return value;
  }
  return "";
}
