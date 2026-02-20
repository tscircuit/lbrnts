import { generateLightBurnSvg, LightBurnBaseElement } from "lbrnts"
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

const MIN_ZOOM = 0.02
const MAX_ZOOM = 100
const VIEWPORT_PADDING = 16

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function App() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [svg, setSvg] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 24, y: 24 })
  const [dragging, setDragging] = useState(false)
  const [lastPointer, setLastPointer] = useState<Point | null>(null)
  const [dropZoneDepth, setDropZoneDepth] = useState(0)

  const canRender = svg.length > 0

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
      setSvg("")
      return
    }

    try {
      const contents = await file.text()
      const project = LightBurnBaseElement.parse(contents)
      const nextSvg = generateLightBurnSvg(project)

      setFileName(file.name)
      setSvg(nextSvg)
      setErrorMessage("")
      fitSvgToViewport(nextSvg)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setFileName(file.name)
      setSvg("")
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
    fitSvgToViewport(svg)
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

          <div
            ref={viewportRef}
            className={`relative h-[70vh] overflow-hidden rounded-lg border bg-slate-950/70 transition ${
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
                  Upload a LightBurn file to render SVG. Use mouse wheel to zoom
                  and drag to pan.
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
                <div
                  className="pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
