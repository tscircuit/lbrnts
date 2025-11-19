import type { INode } from "svgson"

export interface AssembleInput {
  width: number
  height: number
  viewBox: string
  bg: { x: number; y: number; width: number; height: number }
  flipY: number
}

export function assembleSvg(children: INode[], layout: AssembleInput): INode {
  return {
    name: "svg",
    type: "element",
    value: "",
    attributes: {
      xmlns: "http://www.w3.org/2000/svg",
      width: String(layout.width),
      height: String(layout.height),
      viewBox: layout.viewBox,
      style: "background-color: white;",
    },
    children: [
      {
        name: "rect",
        type: "element",
        value: "",
        attributes: {
          x: String(layout.bg.x),
          y: String(layout.bg.y),
          width: String(layout.bg.width),
          height: String(layout.bg.height),
          fill: "white",
        },
        children: [],
      },
      {
        name: "g",
        type: "element",
        value: "",
        attributes: {
          transform: `matrix(1 0 0 -1 0 ${layout.flipY})`,
        },
        children,
      },
    ],
  }
}
