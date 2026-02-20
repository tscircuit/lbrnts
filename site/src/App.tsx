import { CutSetting, generateLightBurnSvg, LightBurnBaseElement } from "lbrnts"
import {
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react"

type Point = {
  x: number
  y: number
}

type LayerInfo = {
  index: number
  name: string
  color: string
}

const MIN_ZOOM = 0.02
const MAX_ZOOM = 100
const VIEWPORT_PADDING = 16

const LIGHTBURN_LAYER_COLORS: Record<number, string> = {
  0: "#000000",
  1: "#0000FF",
  2: "#FF0000",
  3: "#00FF00",
  4: "#FFFF00",
  5: "#FF8000",
  6: "#00FFFF",
  7: "#FF00FF",
  8: "#C0C0C0",
  9: "#808080",
  10: "#800000",
  11: "#008000",
  12: "#000080",
  13: "#808000",
  14: "#800080",
  15: "#008080",
  16: "#A0A0A0",
  17: "#8080C0",
  18: "#FFC0C0",
  19: "#0080FF",
  20: "#FF0080",
  21: "#00FF80",
  22: "#FF8040",
  23: "#FFC0FF",
  24: "#FF80C0",
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const normalizeColor = (value: string | null): string | null => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (normalized === "black") return "#000000"
  return normalized
}

const colorForLayerIndex = (layerIndex: number): string =>
  (LIGHTBURN_LAYER_COLORS[layerIndex] || "#000000").toLowerCase()

const visitElements = (
  root: LightBurnBaseElement | LightBurnBaseElement[],
  visitor: (element: LightBurnBaseElement) => void,
) => {
  const walk = (element: LightBurnBaseElement) => {
    visitor(element)
    for (const child of element.getChildren()) {
      walk(child)
    }
  }

  if (Array.isArray(root)) {
    for (const element of root) walk(element)
    return
  }

  walk(root)
}

const collectLayerInfo = (
  root: LightBurnBaseElement | LightBurnBaseElement[],
): LayerInfo[] => {
  const usedIndices = new Set<number>()
  const cutSettingsByIndex = new Map<number, string>()

  visitElements(root, (element) => {
    const candidate = element as { cutIndex?: unknown }
    if (typeof candidate.cutIndex === "number") {
      usedIndices.add(candidate.cutIndex)
    }

    if (element instanceof CutSetting && typeof element.index === "number") {
      cutSettingsByIndex.set(element.index, element.name || "")
    }
  })

  const indices = new Set<number>([
    ...Array.from(usedIndices),
    ...Array.from(cutSettingsByIndex.keys()),
  ])

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      name:
        cutSettingsByIndex.get(index) ||
        `C${index.toString().padStart(2, "0")}`,
      color: colorForLayerIndex(index),
    }))
}

const getLeafLayerColor = (group: SVGGElement): string | null => {
  const strokedNode = group.querySelector("[stroke]:not([stroke='none'])")
  const strokeColor = normalizeColor(
    strokedNode?.getAttribute("stroke") || null,
  )
  if (strokeColor) return strokeColor

  const filledNode = group.querySelector("[fill]:not([fill='none'])")
  const fillColor = filledNode?.getAttribute("fill") || null
  if (fillColor && !fillColor.trim().toLowerCase().startsWith("url(")) {
    return normalizeColor(fillColor)
  }

  return null
}

const applyLayerVisibility = (
  sourceSvg: string,
  layers: LayerInfo[],
  visibilityByIndex: Record<number, boolean>,
): string => {
  if (!sourceSvg) return ""

  const hiddenColors = new Set(
    layers
      .filter((layer) => visibilityByIndex[layer.index] === false)
      .map((layer) => normalizeColor(layer.color))
      .filter((color): color is string => Boolean(color)),
  )

  if (hiddenColors.size === 0) {
    return sourceSvg
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(sourceSvg, "image/svg+xml")
  const svgElement = doc.querySelector("svg")
  if (!svgElement) {
    return sourceSvg
  }

  const groups = Array.from(svgElement.querySelectorAll("g"))
  for (const group of groups) {
    const hasNestedGroup = Array.from(group.children).some(
      (child) => child.tagName.toLowerCase() === "g",
    )
    if (hasNestedGroup) continue

    const layerColor = getLeafLayerColor(group)
    if (layerColor && hiddenColors.has(layerColor)) {
      group.setAttribute("display", "none")
    }
  }

  return new XMLSerializer().serializeToString(svgElement)
}

export function App() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [sourceSvg, setSourceSvg] = useState<string>("")
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [layerVisibilityByIndex, setLayerVisibilityByIndex] = useState<
    Record<number, boolean>
  >({})
  const [fileName, setFileName] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 24, y: 24 })
  const [dragging, setDragging] = useState(false)
  const [lastPointer, setLastPointer] = useState<Point | null>(null)
  const [dropZoneDepth, setDropZoneDepth] = useState(0)

  const canRender = sourceSvg.length > 0

  const renderedSvg = useMemo(
    () => applyLayerVisibility(sourceSvg, layers, layerVisibilityByIndex),
    [layerVisibilityByIndex, layers, sourceSvg],
  )
  const renderedSvgDataUri = useMemo(
    () =>
      renderedSvg
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderedSvg)}`
        : "",
    [renderedSvg],
  )

  const getSvgDimensions = (svgString: string): Point | null => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, "image/svg+xml")
    const svgElement = doc.querySelector("svg")

    if (!svgElement) return null

    const viewBox = svgElement.getAttribute("viewBox")
    if (viewBox) {
      const parts = viewBox
        .trim()
        .split(/[\s,]+/)
        .map((part) => Number.parseFloat(part))
      const width = parts[2]
      const height = parts[3]
      if (parts.length === 4 && width !== undefined && height !== undefined) {
        if (width > 0 && height > 0) {
          return { x: width, y: height }
        }
      }
    }

    const width = Number.parseFloat(svgElement.getAttribute("width") || "")
    const height = Number.parseFloat(svgElement.getAttribute("height") || "")
    if (width > 0 && height > 0) {
      return { x: width, y: height }
    }

    return null
  }

  const fitSvgToViewport = (svgString: string) => {
    const viewport = viewportRef.current
    const dimensions = getSvgDimensions(svgString)
    if (!viewport || !dimensions) {
      setScale(1)
      setOffset({ x: 24, y: 24 })
      return
    }

    const viewportWidth = Math.max(
      0,
      viewport.clientWidth - VIEWPORT_PADDING * 2,
    )
    const viewportHeight = Math.max(
      0,
      viewport.clientHeight - VIEWPORT_PADDING * 2,
    )

    if (viewportWidth === 0 || viewportHeight === 0) {
      setScale(1)
      setOffset({ x: 24, y: 24 })
      return
    }

    const fittedScale = clamp(
      Math.min(viewportWidth / dimensions.x, viewportHeight / dimensions.y),
      MIN_ZOOM,
      MAX_ZOOM,
    )
    const fittedWidth = dimensions.x * fittedScale
    const fittedHeight = dimensions.y * fittedScale

    setScale(fittedScale)
    setOffset({
      x: (viewport.clientWidth - fittedWidth) / 2,
      y: (viewport.clientHeight - fittedHeight) / 2,
    })
  }

  const helperText = useMemo(() => {
    if (!fileName) return "Upload a .lbrn or .lbrn2 file to begin"
    if (errorMessage) return errorMessage
    return `Loaded ${fileName}`
  }, [errorMessage, fileName])

  const loadFile = async (file: File) => {
    if (!file) return

    if (!/\.lbrn2?$/i.test(file.name)) {
      setErrorMessage("Please choose a .lbrn or .lbrn2 file")
      setFileName(file.name)
      setSourceSvg("")
      setLayers([])
      setLayerVisibilityByIndex({})
      return
    }

    try {
      const contents = await file.text()
      const project = LightBurnBaseElement.parse(contents)
      const nextSvg = generateLightBurnSvg(project)
      const nextLayers = collectLayerInfo(project)
      const nextLayerVisibilityByIndex = Object.fromEntries(
        nextLayers.map((layer) => [layer.index, true]),
      ) as Record<number, boolean>

      setFileName(file.name)
      setSourceSvg(nextSvg)
      setLayers(nextLayers)
      setLayerVisibilityByIndex(nextLayerVisibilityByIndex)
      setErrorMessage("")
      fitSvgToViewport(nextSvg)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setFileName(file.name)
      setSourceSvg("")
      setLayers([])
      setLayerVisibilityByIndex({})
      setErrorMessage(`Could not parse file: ${message}`)
    }
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await loadFile(file)
  }

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!canRender) return

    event.preventDefault()

    const zoomIntensity = 0.0015
    const nextScale = clamp(
      scale * Math.exp(-event.deltaY * zoomIntensity),
      MIN_ZOOM,
      MAX_ZOOM,
    )

    const bounds = event.currentTarget.getBoundingClientRect()
    const mouseX = event.clientX - bounds.left
    const mouseY = event.clientY - bounds.top
    const worldX = (mouseX - offset.x) / scale
    const worldY = (mouseY - offset.y) / scale

    setScale(nextScale)
    setOffset({
      x: mouseX - worldX * nextScale,
      y: mouseY - worldY * nextScale,
    })
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canRender) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    setLastPointer({ x: event.clientX, y: event.clientY })
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !lastPointer) return

    const deltaX = event.clientX - lastPointer.x
    const deltaY = event.clientY - lastPointer.y

    setOffset((current) => ({ x: current.x + deltaX, y: current.y + deltaY }))
    setLastPointer({ x: event.clientX, y: event.clientY })
  }

  const stopDragging = () => {
    setDragging(false)
    setLastPointer(null)
  }

  const zoomStep = (direction: "in" | "out") => {
    const multiplier = direction === "in" ? 1.2 : 1 / 1.2
    setScale((current) => clamp(current * multiplier, MIN_ZOOM, MAX_ZOOM))
  }

  const resetView = () => {
    if (!canRender) return
    fitSvgToViewport(sourceSvg)
  }

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDropZoneDepth((current) => current + 1)
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDropZoneDepth((current) => Math.max(0, current - 1))
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDropZoneDepth(0)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    await loadFile(file)
  }

  const dropZoneActive = dropZoneDepth > 0

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#1f2937_0%,#020617_52%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-8">
        <header className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-sky-200">
            lbrnts SVG Viewer
          </h1>
          <p className="mt-1 text-sm text-slate-300">{helperText}</p>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
            <span>Upload file</span>
            <input
              accept=".lbrn,.lbrn2"
              className="sr-only"
              onChange={onFileChange}
              type="file"
            />
          </label>
        </header>

        <section className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 enabled:hover:bg-slate-700 disabled:opacity-40"
              disabled={!canRender}
              onClick={() => zoomStep("in")}
              type="button"
            >
              Zoom in
            </button>
            <button
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 enabled:hover:bg-slate-700 disabled:opacity-40"
              disabled={!canRender}
              onClick={() => zoomStep("out")}
              type="button"
            >
              Zoom out
            </button>
            <button
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 enabled:hover:bg-slate-700 disabled:opacity-40"
              disabled={!canRender}
              onClick={resetView}
              type="button"
            >
              Reset
            </button>

            <span className="ml-auto text-sm text-slate-300">
              Scale: {(scale * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <aside className="rounded-lg border border-slate-700 bg-slate-900/80 p-3 lg:w-64 lg:shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Layers
                </h2>
                {layers.length > 0 ? (
                  <button
                    className="text-xs text-sky-300 hover:text-sky-200"
                    onClick={() => {
                      setLayerVisibilityByIndex(
                        Object.fromEntries(
                          layers.map((layer) => [layer.index, true]),
                        ) as Record<number, boolean>,
                      )
                    }}
                    type="button"
                  >
                    Show all
                  </button>
                ) : null}
              </div>

              {!canRender ? (
                <p className="text-sm text-slate-400">
                  Load a file to list layers.
                </p>
              ) : layers.length === 0 ? (
                <p className="text-sm text-slate-400">No layers detected.</p>
              ) : (
                <ul className="space-y-1.5">
                  {layers.map((layer) => {
                    const checked = layerVisibilityByIndex[layer.index] ?? true
                    return (
                      <li key={layer.index}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-200 hover:bg-slate-800/80">
                          <input
                            checked={checked}
                            className="size-4 rounded border-slate-500 bg-slate-900 accent-sky-400"
                            onChange={() => {
                              setLayerVisibilityByIndex((current) => ({
                                ...current,
                                [layer.index]: !checked,
                              }))
                            }}
                            type="checkbox"
                          />
                          <span
                            aria-hidden="true"
                            className="size-3 rounded-sm border border-slate-500"
                            style={{ backgroundColor: layer.color }}
                          />
                          <span className="truncate">{layer.name}</span>
                          <span className="ml-auto text-xs text-slate-400">
                            C{layer.index.toString().padStart(2, "0")}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </aside>

            <div
              ref={viewportRef}
              className={`relative h-[70vh] overflow-hidden rounded-lg border bg-slate-950/70 transition lg:flex-1 ${
                dropZoneActive
                  ? "border-sky-400 ring-2 ring-sky-400/60"
                  : "border-slate-700"
              }`}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onPointerCancel={stopDragging}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDragging}
              onWheel={onWheel}
            >
              {dropZoneActive ? (
                <div className="absolute inset-0 z-20 grid place-items-center bg-sky-950/70 text-center text-sm font-medium text-sky-100">
                  Drop your .lbrn or .lbrn2 file
                </div>
              ) : null}
              {!canRender ? (
                <div className="grid h-full place-items-center px-6 text-center text-sm text-slate-400">
                  <p>
                    Upload a LightBurn file to render SVG. Use mouse wheel to
                    zoom and drag to pan.
                  </p>
                </div>
              ) : (
                <div
                  className={dragging ? "cursor-grabbing" : "cursor-grab"}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: "0 0",
                  }}
                >
                  <img
                    alt=""
                    className="pointer-events-none select-none"
                    draggable={false}
                    src={renderedSvgDataUri}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
