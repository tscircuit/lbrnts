import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import {
  CutSetting,
  LightBurnBaseElement,
  LightBurnProject,
  ShapeBase,
  ShapeGroup,
  splitLightBurnProjectByCutSetting,
} from "../index"

function collectShapeCutIndexes(element: LightBurnBaseElement): number[] {
  if (element instanceof ShapeGroup) {
    return element.children.flatMap((child) => collectShapeCutIndexes(child))
  }

  if (element instanceof ShapeBase) {
    return element.cutIndex === undefined ? [] : [element.cutIndex]
  }

  return []
}

test("splits an LBRN2 project into one file per CutSetting", () => {
  const xml = readFileSync(
    "tests/assets/repro04-motor-controller.lbrn2",
    "utf-8",
  )

  const files = splitLightBurnProjectByCutSetting(
    xml,
    "tests/assets/repro04-motor-controller.lbrn2",
  )
  expect(files.map((file) => file.fileName)).toEqual([
    "repro04-motor-controller/cut-top-copper.lbrn2",
    "repro04-motor-controller/cut-bottom-copper.lbrn2",
    "repro04-motor-controller/cut-through-board.lbrn2",
    "repro04-motor-controller/hole-punch-top.lbrn2",
    "repro04-motor-controller/hole-punch-bottom.lbrn2",
    "repro04-motor-controller/top-soldermask.lbrn2",
    "repro04-motor-controller/bottom-soldermask.lbrn2",
    "repro04-motor-controller/top-soldermask-cure.lbrn2",
    "repro04-motor-controller/bottom-soldermask-cure.lbrn2",
    "repro04-motor-controller/top-copper-cut-fill.lbrn2",
    "repro04-motor-controller/bottom-copper-cut-fill.lbrn2",
    "repro04-motor-controller/top-oxidation-cleaning.lbrn2",
    "repro04-motor-controller/bottom-oxidation-cleaning.lbrn2",
  ])
  expect(files.map((file) => file.cutIndex)).toEqual([
    0, 1, 2, 14, 15, 3, 11, 10, 12, 6, 7, 8, 9,
  ])
  expect(files.map((file) => file.shapeCount)).toEqual([
    60, 62, 73, 72, 72, 76, 68, 0, 0, 88, 89, 1, 1,
  ])

  for (const file of files) {
    const parsed = LightBurnBaseElement.parse(file.content)
    expect(parsed).toBeInstanceOf(LightBurnProject)
    if (!(parsed instanceof LightBurnProject)) {
      continue
    }

    const cutSettings = parsed.children.filter(
      (child): child is CutSetting => child instanceof CutSetting,
    )
    expect(cutSettings).toHaveLength(1)
    expect(cutSettings[0]?.index).toBe(file.cutIndex)
    expect(cutSettings[0]?.name).toBe(file.cutSettingName)

    expect(file.content).toContain(`<name Value="${file.cutSettingName}"/>`)

    const cutIndexes = parsed.children.flatMap((child) =>
      collectShapeCutIndexes(child),
    )
    if (file.shapeCount > 0) {
      expect(new Set(cutIndexes)).toEqual(new Set([file.cutIndex]))
    }
    expect(cutIndexes).toHaveLength(file.shapeCount)
  }
})
