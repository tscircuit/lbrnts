import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import { LightBurnBaseElement } from "../../lib/classes/LightBurnBaseElement"
import { generateLightBurnSvg } from "../../lib/svg-gen"

test("Scan path renders as outline without hatch fill", async () => {
  const xml = readFileSync("tests/fixtures/path-fill-test.lbrn2", "utf-8")
  const project = LightBurnBaseElement.parse(xml)
  const svg = generateLightBurnSvg(project)

  expect(svg).toContain("<svg")

  expect(svg).not.toContain("<pattern")
  expect(svg).not.toContain('fill="url(#hatch-')
  expect(svg).toContain('fill="none"')

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
