import { expect, test, describe } from "bun:test"
import { readFileSync } from "node:fs"
import { LightBurnBaseElement, generateLightBurnSvg } from "../../index"

describe("Switch Plate (.lbrn2 v2) - cutouts and radii", () => {
  test("parse and generate SVG snapshot", async () => {
    const xml = readFileSync("tests/assets/switch_plate.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain('<svg')
    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })
})
