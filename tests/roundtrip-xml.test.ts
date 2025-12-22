import { describe, expect, test } from "bun:test"
import {
  CutSetting,
  LightBurnBaseElement,
  LightBurnProject,
  ShapePath,
  ShapeRect,
} from "../index"

describe("XML roundtrip tests", () => {
  test("LightBurnProject roundtrip with ShapeRect", () => {
    const rect = new ShapeRect()
    rect.w = 100
    rect.h = 50
    rect.cr = 0
    rect.cutIndex = 0
    rect.xform = [1, 0, 0, 1, 50, 25]

    const project = new LightBurnProject({
      appVersion: "1.6.00",
      formatVersion: "1",
      materialHeight: 0,
      children: [rect],
    })

    const xml = project.getString()
    const parsed = LightBurnBaseElement.parse(xml)

    expect(parsed).toBeInstanceOf(LightBurnProject)
    if (parsed instanceof LightBurnProject) {
      expect(parsed.appVersion).toBe("1.6.00")
      expect(parsed.formatVersion).toBe("1")
      expect(parsed.materialHeight).toBe(0)
      expect(parsed.children).toHaveLength(1)

      const shape = parsed.children[0]
      expect(shape).toBeInstanceOf(ShapeRect)
      if (shape instanceof ShapeRect) {
        expect(shape.w).toBe(100)
        expect(shape.h).toBe(50)
        expect(shape.cr).toBe(0)
        expect(shape.cutIndex).toBe(0)
        expect(shape.xform).toEqual([1, 0, 0, 1, 50, 25])
      }
    }
  })

  test("LightBurnProject roundtrip with CutSetting and ShapePath", () => {
    const cutSetting = new CutSetting({
      index: 0,
      name: "Wood Cut",
      priority: 0,
      type: "Cut",
      speed: 10,
      maxPower: 80,
      minPower: 60,
      numPasses: 2,
      kerf: 0.2,
    })

    const path = new ShapePath({
      cutIndex: 0,
      verts: [
        { x: -25, y: -25 },
        { x: 25, y: -25 },
        { x: 25, y: 25 },
        { x: -25, y: 25 },
      ],
      prims: [{ type: 0 }, { type: 0 }, { type: 0 }, { type: 0 }],
      isClosed: true,
    })

    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      materialHeight: 0,
      children: [cutSetting, path],
    })

    const xml = project.getString()
    const parsed = LightBurnBaseElement.parse(xml)

    expect(parsed).toBeInstanceOf(LightBurnProject)
    if (parsed instanceof LightBurnProject) {
      expect(parsed.children).toHaveLength(2)

      const cs = parsed.children[0]
      expect(cs).toBeInstanceOf(CutSetting)
      if (cs instanceof CutSetting) {
        expect(cs.index).toBe(0)
        expect(cs.name).toBe("Wood Cut")
        expect(cs.priority).toBe(0)
        expect(cs.speed).toBe(10)
        expect(cs.maxPower).toBe(80)
        expect(cs.minPower).toBe(60)
        expect(cs.numPasses).toBe(2)
        expect(cs.kerf).toBe(0.2)
      }

      const shape = parsed.children[1]
      expect(shape).toBeInstanceOf(ShapePath)
      if (shape instanceof ShapePath) {
        expect(shape.cutIndex).toBe(0)
        expect(shape.verts).toHaveLength(4)
        expect(shape.prims).toHaveLength(4)
        expect(shape.isClosed).toBe(true)
        expect(shape.verts[0]).toEqual({ x: -25, y: -25 })
        expect(shape.verts[1]).toEqual({ x: 25, y: -25 })
      }
    }
  })

  test("CutSetting roundtrip with galvo parameters", () => {
    const cutSetting = new CutSetting({
      index: 0,
      name: "Board Cut",
      speed: 20,
      numPasses: 100,
      frequency: 20000,
      pulseWidth: 1e-9,
    })

    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      children: [cutSetting],
    })

    const xml = project.getString()
    const parsed = LightBurnBaseElement.parse(xml)

    expect(parsed).toBeInstanceOf(LightBurnProject)
    if (parsed instanceof LightBurnProject) {
      expect(parsed.children).toHaveLength(1)

      const cs = parsed.children[0]
      expect(cs).toBeInstanceOf(CutSetting)
      if (cs instanceof CutSetting) {
        expect(cs.index).toBe(0)
        expect(cs.name).toBe("Board Cut")
        expect(cs.speed).toBe(20)
        expect(cs.numPasses).toBe(100)
        expect(cs.frequency).toBe(20000)
        expect(cs.pulseWidth).toBe(1e-9)
      }
    }
  })

  test("Roundtrip with bezier curves", () => {
    const path = new ShapePath({
      cutIndex: 0,
      verts: [
        { x: 0, y: -30 },
        { x: 30, y: 0, c: 1, c0x: 30, c0y: -16.5, c1x: 30, c1y: -16.5 },
        { x: 0, y: 30, c: 1, c0x: 30, c0y: 16.5, c1x: 30, c1y: 16.5 },
      ],
      prims: [{ type: 1 }, { type: 1 }, { type: 1 }],
      isClosed: true,
    })

    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      children: [path],
    })

    const xml = project.getString()
    const parsed = LightBurnBaseElement.parse(xml)

    expect(parsed).toBeInstanceOf(LightBurnProject)
    if (parsed instanceof LightBurnProject) {
      const shape = parsed.children[0]
      expect(shape).toBeInstanceOf(ShapePath)
      if (shape instanceof ShapePath) {
        expect(shape.verts).toHaveLength(3)
        expect(shape.verts[1]?.c).toBe(1)
        expect(shape.verts[1]?.c0x).toBe(30)
        expect(shape.verts[1]?.c0y).toBe(-16.5)
        expect(shape.verts[1]?.c1x).toBe(30)
        expect(shape.verts[1]?.c1y).toBe(-16.5)
      }
    }
  })
})
