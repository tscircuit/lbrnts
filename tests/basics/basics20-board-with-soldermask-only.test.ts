import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import { LightBurnBaseElement } from "../../lib/classes/LightBurnBaseElement"
import { generateLightBurnSvg } from "../../lib/svg-gen"

test("Scan vs Cut - scan shapes render as outlines", async () => {
  const xml = readFileSync(
    "tests/assets/board-with-soldermask-only.lbrn2",
    "utf-8",
  )
  const project = LightBurnBaseElement.parse(xml)
  const svg = generateLightBurnSvg(project)

  expect(svg).toContain("<svg")

  expect(svg).not.toContain("<pattern")
  expect(svg).not.toContain('fill="url(#hatch-')

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
