// LightBurn standard color palette
const LIGHTBURN_COLORS: Record<number, string> = {
  0: "#FF0000", // C00 - Red
  1: "#0000FF", // C01 - Blue
  2: "#cb04cbff", // C02 - Magenta
  3: "#008000", // C03 - Dark Green
  4: "#FFFF00", // C04 - Yellow
  5: "#FF8000", // C05 - Orange
  6: "#00FFFF", // C06 - Cyan
  7: "#000000", // C07 - Black
  8: "#C0C0C0", // C08 - Light Gray
  9: "#808080", // C09 - Gray
  10: "#800000", // C10 - Maroon
  11: "#00FF00", // C11 - Green
  12: "#000080", // C12 - Navy
  13: "#808000", // C13 - Olive
  14: "#800080", // C14 - Purple
  15: "#008080", // C15 - Teal
  16: "#A0A0A0", // C16 - Gray
  17: "#8080C0", // C17 - Light Blue/Purple
  18: "#FFC0C0", // C18 - Light Pink
  19: "#0080FF", // C19 - Bright Blue
  20: "#FF0080", // C20 - Hot Pink/Magenta
  21: "#00FF80", // C21 - Spring Green
  22: "#FF8040", // C22 - Light Orange/Peach
  23: "#FFC0FF", // C23 - Light Magenta/Pink
  24: "#FF80C0", // C24 - Pink
}

export function colorForCutIndex(cutIndex: number | undefined): string {
  if (cutIndex === undefined) return "black"
  return LIGHTBURN_COLORS[cutIndex] || "black"
}

/**
 * Convert a hex color to rgba with specified opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Handle #RRGGBB format
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  // Fallback: return the color with opacity appended (not fully correct but works)
  return hex
}
