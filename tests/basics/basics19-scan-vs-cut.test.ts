import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import { LightBurnBaseElement } from "../../lib/classes/LightBurnBaseElement"
import { generateLightBurnSvg } from "../../lib/svg-gen"

test("Scan vs Cut - one filled pad, one outline only", async () => {
  const xml = readFileSync("tests/fixtures/scan-vs-cut.lbrn2", "utf-8")
  const project = LightBurnBaseElement.parse(xml)
  const svg = generateLightBurnSvg(project)

  expect(svg).toContain("<svg")

  // Should have scan lines (from Scan mode rect)
  expect(svg).toContain("<line")
  expect(svg).toContain('stroke-opacity="0.8"')

  // Should have both rects
  const rectCount = (svg.match(/<rect/g) || []).length
  expect(rectCount).toBeGreaterThanOrEqual(2) // At least 2 rects (excluding background)

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
