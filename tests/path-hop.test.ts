import { expect, test } from "bun:test"

import { generateLightBurnSvg, ShapePath } from "../index"

test("shape path moves between separate polygons", async () => {
  const hoppingPath = new ShapePath({
    verts: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 20 },
      { x: 30, y: 30 },
      { x: 20, y: 30 },
    ],
    prims: [
      { type: 0 },
      { type: 0 },
      { type: 0 },
      { type: 2 },
      { type: 0 },
      { type: 0 },
      { type: 0 },
    ],
    isClosed: true,
  })

  const svg = generateLightBurnSvg(hoppingPath)
  const pathMatch = svg.match(/<path[^>]*d="([^"]+)"/)

  expect(pathMatch?.[1]).toBe(
    "M 0 0 L 10 0 L 10 10 L 0 10 Z M 20 20 L 30 20 L 30 30 L 20 30 Z",
  )

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
