"use client"

import Konva from "konva"
import Image from "next/image"
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
Konva.dragButtons = [0]

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

function getCenteredStageTransform(
  key: string,
  imageViewportSize: Size,
  imageSize: [width: number, height: number],
  scale: number
) {
  const [width, height] = imageSize

  return {
    key,
    scale,
    x: defaultViewportPadding + (imageViewportSize.width - width * scale) / 2,
    y: defaultViewportPadding + (imageViewportSize.height - height * scale) / 2,
  }
}

export function EditorStage({
  activeProjectId,
  children,
  imageElement,
  imageSize,
  showThumbnail,
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
  showThumbnail: boolean
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
  const panStartRef = useRef<Point | null>(null)
  const [containerSize, setContainerSize] = useState<Size>({
    height: 0,
    width: 0,
  })
  const [stageTransform, setStageTransform] = useState<StageTransform | null>(
    null
  )
  const imageWidth = imageSize?.[0]
  const imageHeight = imageSize?.[1]

  useLayoutEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      const nextContainerSize = { height: rect.height, width: rect.width }

      setContainerSize(nextContainerSize)

      if (
        imageWidth === undefined ||
        imageHeight === undefined ||
        imageElement?.projectId !== activeProjectId
      ) {
        return
      }

      const stage = stageRef.current

      if (!stage) {
        return
      }

      setStageTransform(
        getCenteredStageTransform(
          `${activeProjectId}:${imageWidth}:${imageHeight}`,
          getImageViewportSize(nextContainerSize),
          [imageWidth, imageHeight],
          stage.scaleX()
        )
      )
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [activeProjectId, imageElement?.projectId, imageHeight, imageWidth])

  const imageViewportSize = getImageViewportSize(containerSize)

  if (!imageSize || imageElement?.projectId !== activeProjectId) {
    const [placeholderWidth, placeholderHeight] = imageSize ?? [4, 3]
    const placeholderScale = Math.min(
      imageViewportSize.width / placeholderWidth,
      imageViewportSize.height / placeholderHeight
    )

    return (
      <div className="relative h-full min-w-0" ref={containerRef}>
        {showThumbnail ? (
          <Image
            alt=""
            className="absolute object-contain blur-sm"
            height={600}
            src={`/api/projects/${activeProjectId}/image?kind=thumbnail`}
            style={{
              height: placeholderScale * placeholderHeight,
              left:
                defaultViewportPadding +
                (imageViewportSize.width -
                  placeholderScale * placeholderWidth) /
                  2,
              top:
                defaultViewportPadding +
                (imageViewportSize.height -
                  placeholderScale * placeholderHeight) /
                  2,
              width: placeholderScale * placeholderWidth,
            }}
            unoptimized
            width={800}
          />
        ) : (
          <Skeleton
            className="absolute"
            style={{
              height: placeholderScale * placeholderHeight,
              left:
                defaultViewportPadding +
                (imageViewportSize.width -
                  placeholderScale * placeholderWidth) /
                  2,
              top:
                defaultViewportPadding +
                (imageViewportSize.height -
                  placeholderScale * placeholderHeight) /
                  2,
              width: placeholderScale * placeholderWidth,
            }}
          />
        )}
      </div>
    )
  }

  const [width, height] = imageSize
  const fitScale = Math.min(
    imageViewportSize.width / width,
    imageViewportSize.height / height
  )
  const stageTransformKey = `${activeProjectId}:${width}:${height}`
  const defaultStageTransform = getCenteredStageTransform(
    stageTransformKey,
    imageViewportSize,
    imageSize,
    fitScale
  )
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
    const direction = event.evt.deltaY > 0 ? -1 : 1

    const scaleBy = event.evt.ctrlKey
      ? Math.exp(Math.abs(event.evt.deltaY) * 0.01)
      : 1.05
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const scale = Math.max(fitScale / 8, Math.min(fitScale * 16, newScale))

    setStageTransform({
      key: activeStageTransform.key,
      scale,
      x: pointer.x - mousePointTo.x * scale,
      y: pointer.y - mousePointTo.y * scale,
    })
  }

  function handleMouseDown(event: Konva.KonvaEventObject<MouseEvent>) {
    if (event.evt.button !== 1 && event.evt.button !== 2) {
      onMouseDown(event)
      return
    }

    event.evt.preventDefault()
    panStartRef.current = {
      x: event.evt.clientX,
      y: event.evt.clientY,
    }
  }

  function handleMouseMove(event: Konva.KonvaEventObject<MouseEvent>) {
    const start = panStartRef.current
    const stage = stageRef.current

    if (!start || !stage) {
      onMouseMove(event)
      return
    }

    const position = {
      x: event.evt.clientX,
      y: event.evt.clientY,
    }

    setStageTransform({
      key: activeStageTransform.key,
      scale: stage.scaleX(),
      x: stage.x() + position.x - start.x,
      y: stage.y() + position.y - start.y,
    })
    panStartRef.current = position
  }

  function handleMouseUp(event: Konva.KonvaEventObject<MouseEvent>) {
    if (!panStartRef.current) {
      onMouseUp(event)
      return
    }

    event.evt.preventDefault()
    panStartRef.current = null
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
    <div
      ref={containerRef}
      className="relative h-full min-w-0 overflow-hidden"
      onContextMenu={(event) => event.preventDefault()}
    >
      <Stage
        height={containerSize.height}
        onClick={onClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
