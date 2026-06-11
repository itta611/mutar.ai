"use client"

import Konva from "konva"
import { type ReactNode, useLayoutEffect, useRef, useState } from "react"
import { Stage } from "react-konva"

import { Skeleton } from "@/components/ui/skeleton"

type StageTransform = {
  key: string
  x: number
  y: number
  scale: number
}

type Size = {
  height: number
  width: number
}

type Point = {
  x: number
  y: number
}

type ImageElement = {
  image: HTMLImageElement
  projectId: string
}

const defaultViewportPadding = 80
const projectSwitcherHeight = 96
Konva.hitOnDragEnabled = true

function getImageViewportSize(containerSize: Size) {
  return {
    width: Math.max(1, containerSize.width - defaultViewportPadding * 2),
    height: Math.max(
      1,
      containerSize.height - projectSwitcherHeight - defaultViewportPadding * 2
    ),
  }
}

function getDistance(p1: Point, p2: Point) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}

function getCenter(p1: Point, p2: Point) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

export function EditorStage({
  activeProjectId,
  children,
  imageElement,
  imageSize,
  onClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTap,
}: {
  activeProjectId: string
  children: ReactNode
  imageElement: ImageElement | null
  imageSize: [width: number, height: number] | null
  onClick: (event: Konva.KonvaEventObject<Event>) => void
  onMouseDown: (event: Konva.KonvaEventObject<MouseEvent>) => void
  onMouseMove: (event: Konva.KonvaEventObject<MouseEvent>) => void
  onMouseUp: (event: Konva.KonvaEventObject<MouseEvent>) => void
  onTap: (event: Konva.KonvaEventObject<Event>) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const lastTouchCenterRef = useRef<Point | null>(null)
  const lastTouchDistanceRef = useRef(0)
  const [containerSize, setContainerSize] = useState<Size>({
    height: 0,
    width: 0,
  })
  const [stageTransform, setStageTransform] = useState<StageTransform | null>(
    null
  )

  useLayoutEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect()

      setContainerSize({ height: rect.height, width: rect.width })
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  const imageViewportSize = getImageViewportSize(containerSize)

  if (!imageSize || imageElement?.projectId !== activeProjectId) {
    const skeletonScale = Math.min(
      imageViewportSize.width / 4,
      imageViewportSize.height / 3
    )

    return (
      <div className="relative min-h-full" ref={containerRef}>
        <Skeleton
          className="absolute"
          style={{
            height: skeletonScale * 3,
            left:
              defaultViewportPadding +
              (imageViewportSize.width - skeletonScale * 4) / 2,
            top:
              defaultViewportPadding +
              (imageViewportSize.height - skeletonScale * 3) / 2,
            width: skeletonScale * 4,
          }}
        />
      </div>
    )
  }

  const [width, height] = imageSize
  const fitScale = Math.min(
    imageViewportSize.width / width,
    imageViewportSize.height / height
  )
  const stageTransformKey = `${activeProjectId}:${width}:${height}:${containerSize.width}:${containerSize.height}`
  const defaultStageTransform = {
    key: stageTransformKey,
    scale: fitScale,
    x:
      defaultViewportPadding + (imageViewportSize.width - width * fitScale) / 2,
    y:
      defaultViewportPadding +
      (imageViewportSize.height - height * fitScale) / 2,
  }
  const activeStageTransform =
    stageTransform?.key === stageTransformKey
      ? stageTransform
      : defaultStageTransform

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault()

    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()

    if (!stage || !pointer) {
      return
    }

    const oldScale = stage.scaleX()
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    let direction = event.evt.deltaY > 0 ? -1 : 1

    if (event.evt.ctrlKey) {
      direction = -direction
    }

    const scaleBy = 1.05
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const scale = Math.max(fitScale / 8, Math.min(fitScale * 16, newScale))

    setStageTransform({
      key: activeStageTransform.key,
      scale,
      x: pointer.x - mousePointTo.x * scale,
      y: pointer.y - mousePointTo.y * scale,
    })
  }

  function handleTouchMove(event: Konva.KonvaEventObject<TouchEvent>) {
    event.evt.preventDefault()

    const touch1 = event.evt.touches[0]
    const touch2 = event.evt.touches[1]
    const stage = stageRef.current

    if (!stage) {
      return
    }

    if (!touch1 || !touch2) {
      return
    }

    const rect = stage.container().getBoundingClientRect()
    const p1 = {
      x: touch1.clientX - rect.left,
      y: touch1.clientY - rect.top,
    }
    const p2 = {
      x: touch2.clientX - rect.left,
      y: touch2.clientY - rect.top,
    }
    const newCenter = getCenter(p1, p2)
    const lastCenter = lastTouchCenterRef.current

    if (!lastCenter) {
      lastTouchCenterRef.current = newCenter
      return
    }

    const distance = getDistance(p1, p2)

    if (!lastTouchDistanceRef.current) {
      lastTouchDistanceRef.current = distance
      return
    }

    const pointTo = {
      x: (newCenter.x - stage.x()) / stage.scaleX(),
      y: (newCenter.y - stage.y()) / stage.scaleX(),
    }
    const scale = Math.max(
      fitScale / 8,
      Math.min(
        fitScale * 16,
        stage.scaleX() * (distance / lastTouchDistanceRef.current)
      )
    )
    const dx = newCenter.x - lastCenter.x
    const dy = newCenter.y - lastCenter.y

    setStageTransform({
      key: activeStageTransform.key,
      scale,
      x: newCenter.x - pointTo.x * scale + dx,
      y: newCenter.y - pointTo.y * scale + dy,
    })
    lastTouchDistanceRef.current = distance
    lastTouchCenterRef.current = newCenter
  }

  function handleTouchEnd() {
    lastTouchDistanceRef.current = 0
    lastTouchCenterRef.current = null
  }

  return (
    <div ref={containerRef} className="relative min-h-full overflow-hidden">
      <Stage
        height={containerSize.height}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTap={onTap}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
        ref={stageRef}
        scaleX={activeStageTransform.scale}
        scaleY={activeStageTransform.scale}
        width={containerSize.width}
        x={activeStageTransform.x}
        y={activeStageTransform.y}
      >
        {children}
      </Stage>
    </div>
  )
}
