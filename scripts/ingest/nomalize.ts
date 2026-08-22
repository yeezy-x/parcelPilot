export function normalizeEnum(value: unknown): string {
    if (typeof value !== "string") {
      throw new Error(`Expected enum value to be a string`);
    }
    return value.trim().toUpperCase();
  }
  
export function normalizeBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
      if (normalized === "yes") return true;
      if (normalized === "no") return false;
      if (normalized === "1") return true;
      if (normalized === "0") return false;
    }
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    throw new Error(`Invalid boolean value: ${String(value)}`);
  }