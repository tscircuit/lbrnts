import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import { LightBurnBaseElement } from "../../lib/classes/LightBurnBaseElement"
import { generateLightBurnSvg } from "../../lib/svg-gen"

test("Scan vs Cut - scan pads render as outlines", async () => {
  const xml = readFileSync("tests/fixtures/scan-vs-cut.lbrn2", "utf-8")
  const project = LightBurnBaseElement.parse(xml)
  const svg = generateLightBurnSvg(project)

  expect(svg).toContain("<svg")

  // Preview should match LightBurn's software view: outlines only.
  expect(svg).not.toContain("<pattern")
  expect(svg).not.toContain('fill="url(#hatch-')

  // Should have both rects
  const rectCount = (svg.match(/<rect/g) || []).length
  expect(rectCount).toBeGreaterThanOrEqual(2) // At least 2 rects (excluding background)

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
