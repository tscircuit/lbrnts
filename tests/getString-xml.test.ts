import { describe, expect, test } from "bun:test"
import { CutSetting, LightBurnProject, ShapePath, ShapeRect } from "../index"

describe("getString() returns full LightBurn XML", () => {
  test("empty LightBurnProject", () => {
    const project = new LightBurnProject()
    expect(project.getString()).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="UTF-8"?>
      <LightBurnProject/>"
    `)
  })

  test("LightBurnProject with basic attributes", () => {
    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      materialHeight: 0,
      mirrorX: false,
      mirrorY: false,
    })
    expect(project.getString()).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="UTF-8"?>
      <LightBurnProject AppVersion="1.7.03" FormatVersion="1" MaterialHeight="0" MirrorX="False" MirrorY="False"/>"
    `)
  })

  test("LightBurnProject with single ShapeRect", () => {
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

    expect(project.getString()).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="UTF-8"?>
      <LightBurnProject AppVersion="1.6.00" FormatVersion="1" MaterialHeight="0">
          <Shape Type="Rect" CutIndex="0" W="100" H="50" Cr="0">
              <XForm>1 0 0 1 50 25</XForm>
          </Shape>
      </LightBurnProject>"
    `)
  })

  test("LightBurnProject with CutSetting", () => {
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

    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      materialHeight: 0,
      children: [cutSetting],
    })

    expect(project.getString()).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="UTF-8"?>
      <LightBurnProject AppVersion="1.7.03" FormatVersion="1" MaterialHeight="0">
          <CutSetting type="Cut">
              <index Value="0"/>
              <name Value="Wood Cut"/>
              <priority Value="0"/>
              <minPower Value="60"/>
              <maxPower Value="80"/>
              <speed Value="10"/>
              <kerf Value="0.2"/>
              <numPasses Value="2"/>
          </CutSetting>
      </LightBurnProject>"
    `)
  })

  test("LightBurnProject with CutSetting and ShapePath (square)", () => {
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

    expect(project.getString()).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="UTF-8"?>
      <LightBurnProject AppVersion="1.7.03" FormatVersion="1" MaterialHeight="0">
          <CutSetting type="Cut">
              <index Value="0"/>
              <name Value="Wood Cut"/>
              <priority Value="0"/>
              <minPower Value="60"/>
              <maxPower Value="80"/>
              <speed Value="10"/>
              <kerf Value="0.2"/>
              <numPasses Value="2"/>
          </CutSetting>
          <Shape Type="Path" CutIndex="0">
              <XForm>1 0 0 1 0 0</XForm>
              <VertList>V-25 -25V25 -25V25 25V-25 25</VertList>
              <PrimList>L0 1L1 2L2 3L3 0</PrimList>
          </Shape>
      </LightBurnProject>"
    `)
  })

  test("LightBurnProject with advanced CutSetting (power ramp)", () => {
    const cutSetting = new CutSetting({
      index: 0,
      name: "Acrylic Engrave",
      priority: 1,
      type: "Cut",
      speed: 150,
      maxPower: 50,
      minPower: 40,
      numPasses: 3,
      enablePowerRamp: true,
      rampLength: 2,
    })

    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      children: [cutSetting],
    })

    expect(project.getString()).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="UTF-8"?>
      <LightBurnProject AppVersion="1.7.03" FormatVersion="1">
          <CutSetting type="Cut">
              <index Value="0"/>
              <name Value="Acrylic Engrave"/>
              <priority Value="1"/>
              <minPower Value="40"/>
              <maxPower Value="50"/>
              <speed Value="150"/>
              <enablePowerRamp Value="true"/>
              <rampLength Value="2"/>
              <numPasses Value="3"/>
          </CutSetting>
      </LightBurnProject>"
    `)
  })

  test("LightBurnProject with multiple shapes", () => {
    const cutSetting = new CutSetting({
      index: 2,
      name: "C02",
      maxPower: 20,
      maxPower2: 20,
      speed: 8.33333,
      priority: 0,
    })

    const rect1 = new ShapeRect()
    rect1.w = 38.710007
    rect1.h = 57.169998
    rect1.cr = 0
    rect1.cutIndex = 2
    rect1.xform = [1, 0, 0, 1, 89.992508, 257]

    const rect2 = new ShapeRect()
    rect2.w = 38.709999
    rect2.h = 23.050011
    rect2.cr = 0
    rect2.cutIndex = 2
    rect2.xform = [1, 0, 0, 1, 90.007507, 274.00543]

    const rect3 = new ShapeRect()
    rect3.w = 38.695
    rect3.h = 34.06543
    rect3.cr = 0
    rect3.cutIndex = 2
    rect3.xform = [1, 0, 0, 1, 90.000015, 245.44772]

    const project = new LightBurnProject({
      appVersion: "1.4.03",
      formatVersion: "1",
      materialHeight: 0,
      mirrorX: false,
      mirrorY: false,
      children: [cutSetting, rect1, rect2, rect3],
    })

    expect(project.getString()).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="UTF-8"?>
      <LightBurnProject AppVersion="1.4.03" FormatVersion="1" MaterialHeight="0" MirrorX="False" MirrorY="False">
          <CutSetting type="Cut">
              <index Value="2"/>
              <name Value="C02"/>
              <priority Value="0"/>
              <maxPower Value="20"/>
              <maxPower2 Value="20"/>
              <speed Value="8.33333"/>
          </CutSetting>
          <Shape Type="Rect" CutIndex="2" W="38.710007" H="57.169998" Cr="0">
              <XForm>1 0 0 1 89.992508 257</XForm>
          </Shape>
          <Shape Type="Rect" CutIndex="2" W="38.709999" H="23.050011" Cr="0">
              <XForm>1 0 0 1 90.007507 274.00543</XForm>
          </Shape>
          <Shape Type="Rect" CutIndex="2" W="38.695" H="34.06543" Cr="0">
              <XForm>1 0 0 1 90.000015 245.44772</XForm>
          </Shape>
      </LightBurnProject>"
    `)
  })

  test("ShapeRect with all properties", () => {
    const rect = new ShapeRect()
    rect.w = 100
    rect.h = 50
    rect.cr = 5
    rect.cutIndex = 1
    rect.locked = true
    rect.xform = [1, 0, 0, 1, 50, 25]

    expect(rect.getString()).toMatchInlineSnapshot(`
      "<Shape Type="Rect" CutIndex="1" Locked="True" W="100" H="50" Cr="5">
          <XForm>1 0 0 1 50 25</XForm>
      </Shape>"
    `)
  })

  test("CutSetting with minimal properties", () => {
    const cutSetting = new CutSetting({
      index: 0,
      name: "Default",
      speed: 100,
    })

    expect(cutSetting.getString()).toMatchInlineSnapshot(`
      "<CutSetting type="Cut">
          <index Value="0"/>
          <name Value="Default"/>
          <speed Value="100"/>
      </CutSetting>"
    `)
  })

  test("CutSetting with galvo parameters", () => {
    const cutSetting = new CutSetting({
      index: 0,
      name: "Copper Cut",
      speed: 300,
      numPasses: 100,
      frequency: 20000,
      pulseWidth: 1e-9,
    })

    expect(cutSetting.getString()).toMatchInlineSnapshot(`
      "<CutSetting type="Cut">
          <index Value="0"/>
          <name Value="Copper Cut"/>
          <speed Value="300"/>
          <numPasses Value="100"/>
          <frequency Value="20000"/>
          <pulseWidth Value="1e-9"/>
      </CutSetting>"
    `)
  })

  test("ShapePath with bezier curves", () => {
    const path = new ShapePath({
      cutIndex: 0,
      verts: [
        { x: 0, y: -30 },
        { x: 30, y: 0, c: 1, c0x: 30, c0y: -16.5, c1x: 30, c1y: -16.5 },
        { x: 0, y: 30, c: 1, c0x: 30, c0y: 16.5, c1x: 30, c1y: 16.5 },
        { x: -30, y: 0, c: 1, c0x: -30, c0y: 16.5, c1x: -30, c1y: 16.5 },
        { x: 0, y: -30, c: 1, c0x: -30, c0y: -16.5, c1x: -30, c1y: -16.5 },
      ],
      prims: [{ type: 1 }, { type: 1 }, { type: 1 }, { type: 1 }],
      isClosed: true,
    })

    expect(path.getString()).toMatchInlineSnapshot(`
      "<Shape Type="Path" CutIndex="0">
          <XForm>1 0 0 1 0 0</XForm>
          <VertList>V0 -30V30 0c1c0x30c0y-16.5c1x30c1y-16.5V0 30c1c0x30c0y16.5c1x30c1y16.5V-30 0c1c0x-30c0y16.5c1x-30c1y16.5V0 -30c1c0x-30c0y-16.5c1x-30c1y-16.5</VertList>
          <PrimList>B0 1B1 2B2 3B3 0</PrimList>
      </Shape>"
    `)
  })
})
