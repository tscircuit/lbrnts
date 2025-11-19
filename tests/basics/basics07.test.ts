import { expect, test, describe } from "bun:test"
import { readFileSync } from "node:fs"
import { LightBurnBaseElement, generateLightBurnSvg } from "../../index"

describe("Black Acrylic Sample Burn (.lbrn2 v2) - material test", () => {
  test("parse and generate SVG snapshot", async () => {
    const xml = readFileSync("tests/assets/black_acrilic_sample_burn.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain('<svg')
    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })
})
