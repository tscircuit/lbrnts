/**
 * Coercion helpers for parsing XML attributes
 */

export function num(v: any, defaultValue: number = 0): number {
  if (v === null || v === undefined) return defaultValue
  if (typeof v === "number") return v
  const parsed = Number(v)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

export function boolish(v: any, defaultValue: boolean = false): boolean {
  if (v === null || v === undefined) return defaultValue
  if (typeof v === "boolean") return v
  if (typeof v === "string") {
    const lower = v.toLowerCase()
    if (lower === "true" || lower === "1") return true
    if (lower === "false" || lower === "0") return false
  }
  if (typeof v === "number") return v !== 0
  return defaultValue
}

export function str(v: any, defaultValue: string = ""): string {
  if (v === null || v === undefined) return defaultValue
  return String(v)
}
