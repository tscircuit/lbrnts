import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import { LightBurnBaseElement } from "../../lib/classes/LightBurnBaseElement"
import { generateLightBurnSvg } from "../../lib/svg-gen"

test("Path fill with proper clipping - scan lines only inside path boundary", async () => {
  const xml = readFileSync("tests/fixtures/path-fill-test.lbrn2", "utf-8")
  const project = LightBurnBaseElement.parse(xml)
  const svg = generateLightBurnSvg(project)

  expect(svg).toContain("<svg")

  // Should have scan lines
  expect(svg).toContain("<line")
  expect(svg).toContain('stroke-opacity="0.8"')

  // Should have clipPath element to clip scan lines to path boundary
  expect(svg).toContain("<clipPath")
  expect(svg).toContain("clip-path")

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
