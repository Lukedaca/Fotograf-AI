import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';

export type RetouchTool = 'none' | 'brush' | 'lasso' | 'rectangle';

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CanvasViewportHandle {
  getTransform: () => ViewportTransform;
  fitToScreen: () => void;
  zoomTo: (scale: number) => void;
  getMaskDataUrl: () => string | null;
  clearMask: () => void;
}

interface CanvasViewportProps {
  imageSrc: string;
  activeTool: RetouchTool;
  brushSize: number;
  onMaskReady?: (maskDataUrl: string) => void;
  className?: string;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.1;
const MINIMAP_W = 160;
const MINIMAP_H = 110;

const CanvasViewport = forwardRef<CanvasViewportHandle, CanvasViewportProps>(
  ({ imageSrc, activeTool, brushSize, onMaskReady, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const transformRef = useRef<ViewportTransform>({ scale: 1, offsetX: 0, offsetY: 0 });
    const [displayScale, setDisplayScale] = useState(1);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const isPanningRef = useRef(false);
    const isDrawingRef = useRef(false);
    const spaceHeldRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);
    const rectStartRef = useRef<{ x: number; y: number } | null>(null);

    // --- Image loading ---
    useEffect(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        // Init mask canvas to image dimensions
        if (maskCanvasRef.current) {
          maskCanvasRef.current.width = img.naturalWidth;
          maskCanvasRef.current.height = img.naturalHeight;
        }
        fitToScreen();
      };
      img.src = imageSrc;
    }, [imageSrc]);

    // --- Fit to screen ---
    const fitToScreen = useCallback(() => {
      const container = containerRef.current;
      const img = imageRef.current;
      if (!container || !img) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const scale = Math.min(cw / iw, ch / ih) * 0.92;
      transformRef.current = {
        scale,
        offsetX: (cw - iw * scale) / 2,
        offsetY: (ch - ih * scale) / 2,
      };
      setDisplayScale(scale);
      render();
    }, []);

    // --- Coordinate helpers ---
    const screenToImage = useCallback((sx: number, sy: number) => {
      const t = transformRef.current;
      return {
        x: (sx - t.offsetX) / t.scale,
        y: (sy - t.offsetY) / t.scale,
      };
    }, []);

    const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    // --- Render main canvas ---
    const render = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const img = imageRef.current;
      const container = containerRef.current;
      if (!canvas || !ctx || !img || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      const t = transformRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Checkerboard background for transparency
      ctx.save();
      ctx.translate(t.offsetX, t.offsetY);
      ctx.scale(t.scale, t.scale);

      const patternSize = 16;
      for (let y = 0; y < img.naturalHeight; y += patternSize) {
        for (let x = 0; x < img.naturalWidth; x += patternSize) {
          ctx.fillStyle = (Math.floor(x / patternSize) + Math.floor(y / patternSize)) % 2 === 0 ? '#2a2a2a' : '#1a1a1a';
          ctx.fillRect(x, y, patternSize, patternSize);
        }
      }

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw mask overlay
      if (maskCanvasRef.current) {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(maskCanvasRef.current, 0, 0);
        ctx.globalAlpha = 1;
      }

      // Draw lasso preview
      if (activeTool === 'lasso' && lassoPointsRef.current.length > 1) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2 / t.scale;
        ctx.setLineDash([6 / t.scale, 4 / t.scale]);
        ctx.beginPath();
        const pts = lassoPointsRef.current;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw rectangle preview
      if (activeTool === 'rectangle' && rectStartRef.current && isDrawingRef.current) {
        const rs = rectStartRef.current;
        const last = screenToImage(lastMouseRef.current.x, lastMouseRef.current.y);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2 / t.scale;
        ctx.setLineDash([6 / t.scale, 4 / t.scale]);
        ctx.strokeRect(
          Math.min(rs.x, last.x),
          Math.min(rs.y, last.y),
          Math.abs(last.x - rs.x),
          Math.abs(last.y - rs.y)
        );
        ctx.setLineDash([]);
      }

      ctx.restore();

      // Render minimap
      renderMinimap();
    }, [activeTool, screenToImage]);

    // --- Minimap ---
    const renderMinimap = useCallback(() => {
      const mc = minimapCanvasRef.current;
      const ctx = mc?.getContext('2d');
      const img = imageRef.current;
      const container = containerRef.current;
      if (!mc || !ctx || !img || !container) return;

      mc.width = MINIMAP_W;
      mc.height = MINIMAP_H;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      let mw = MINIMAP_W;
      let mh = MINIMAP_H;
      if (imgAspect > MINIMAP_W / MINIMAP_H) {
        mh = MINIMAP_W / imgAspect;
      } else {
        mw = MINIMAP_H * imgAspect;
      }
      const mx = (MINIMAP_W - mw) / 2;
      const my = (MINIMAP_H - mh) / 2;

      ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);
      ctx.drawImage(img, mx, my, mw, mh);

      // Viewport rectangle
      const t = transformRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaleToMini = mw / img.naturalWidth;

      const vx = mx + (-t.offsetX / t.scale) * scaleToMini;
      const vy = my + (-t.offsetY / t.scale) * scaleToMini;
      const vw = (cw / t.scale) * scaleToMini;
      const vh = (ch / t.scale) * scaleToMini;

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx, vy, vw, vh);
    }, []);

    // --- Zoom ---
    const zoom = useCallback((delta: number, cx: number, cy: number) => {
      const t = transformRef.current;
      const oldScale = t.scale;
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldScale * (1 + delta)));

      const imgX = (cx - t.offsetX) / oldScale;
      const imgY = (cy - t.offsetY) / oldScale;

      t.scale = newScale;
      t.offsetX = cx - imgX * newScale;
      t.offsetY = cy - imgY * newScale;
      setDisplayScale(newScale);
      render();
    }, [render]);

    // --- Wheel handler ---
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        zoom(delta, cx, cy);
      };

      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }, [zoom]);

    // --- Keyboard shortcuts ---
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.code === 'Space' && !spaceHeldRef.current) {
          spaceHeldRef.current = true;
          e.preventDefault();
        }
        if (e.code === 'Digit0' || e.code === 'Numpad0') {
          fitToScreen();
        }
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          // 100% zoom centered
          const container = containerRef.current;
          const img = imageRef.current;
          if (container && img) {
            transformRef.current = {
              scale: 1,
              offsetX: (container.clientWidth - img.naturalWidth) / 2,
              offsetY: (container.clientHeight - img.naturalHeight) / 2,
            };
            setDisplayScale(1);
            render();
          }
        }
        if (e.code === 'Equal' || e.code === 'NumpadAdd') {
          const container = containerRef.current;
          if (container) {
            zoom(ZOOM_STEP, container.clientWidth / 2, container.clientHeight / 2);
          }
        }
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
          const container = containerRef.current;
          if (container) {
            zoom(-ZOOM_STEP, container.clientWidth / 2, container.clientHeight / 2);
          }
        }
        if (e.code === 'BracketLeft' && activeTool === 'brush') {
          // Decrease brush size - handled by parent
        }
        if (e.code === 'BracketRight' && activeTool === 'brush') {
          // Increase brush size - handled by parent
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          spaceHeldRef.current = false;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, [fitToScreen, render, zoom, activeTool]);

    // --- Mouse handlers ---
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      const coords = getCanvasCoords(e);
      lastMouseRef.current = coords;

      // Middle mouse button or space+click = pan
      if (e.button === 1 || spaceHeldRef.current) {
        isPanningRef.current = true;
        e.preventDefault();
        return;
      }

      if (e.button !== 0 || activeTool === 'none') return;

      isDrawingRef.current = true;
      const imgCoords = screenToImage(coords.x, coords.y);

      if (activeTool === 'brush') {
        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (maskCtx) {
          maskCtx.fillStyle = '#ff000099';
          maskCtx.beginPath();
          maskCtx.arc(imgCoords.x, imgCoords.y, brushSize / 2, 0, Math.PI * 2);
          maskCtx.fill();
          render();
        }
      } else if (activeTool === 'lasso') {
        lassoPointsRef.current = [imgCoords];
      } else if (activeTool === 'rectangle') {
        rectStartRef.current = imgCoords;
      }
    }, [activeTool, brushSize, getCanvasCoords, screenToImage, render]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      const coords = getCanvasCoords(e);

      if (isPanningRef.current) {
        const dx = coords.x - lastMouseRef.current.x;
        const dy = coords.y - lastMouseRef.current.y;
        transformRef.current.offsetX += dx;
        transformRef.current.offsetY += dy;
        lastMouseRef.current = coords;
        render();
        return;
      }

      lastMouseRef.current = coords;
      if (activeTool === 'brush') setCursorPos(coords);

      if (!isDrawingRef.current) {
        return;
      }

      const imgCoords = screenToImage(coords.x, coords.y);

      if (activeTool === 'brush') {
        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (maskCtx) {
          maskCtx.fillStyle = '#ff000099';
          maskCtx.beginPath();
          maskCtx.arc(imgCoords.x, imgCoords.y, brushSize / 2, 0, Math.PI * 2);
          maskCtx.fill();
          render();
        }
      } else if (activeTool === 'lasso') {
        lassoPointsRef.current.push(imgCoords);
        render();
      } else if (activeTool === 'rectangle') {
        render();
      }
    }, [activeTool, brushSize, getCanvasCoords, screenToImage, render]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }

      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const maskCtx = maskCanvasRef.current?.getContext('2d');
      if (!maskCtx) return;

      if (activeTool === 'lasso' && lassoPointsRef.current.length > 2) {
        maskCtx.fillStyle = '#ff000099';
        maskCtx.beginPath();
        const pts = lassoPointsRef.current;
        maskCtx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          maskCtx.lineTo(pts[i].x, pts[i].y);
        }
        maskCtx.closePath();
        maskCtx.fill();
        lassoPointsRef.current = [];
        render();
      } else if (activeTool === 'rectangle' && rectStartRef.current) {
        const imgCoords = screenToImage(
          lastMouseRef.current.x,
          lastMouseRef.current.y
        );
        const rs = rectStartRef.current;
        const x = Math.min(rs.x, imgCoords.x);
        const y = Math.min(rs.y, imgCoords.y);
        const w = Math.abs(imgCoords.x - rs.x);
        const h = Math.abs(imgCoords.y - rs.y);
        if (w > 2 && h > 2) {
          maskCtx.fillStyle = '#ff000099';
          maskCtx.fillRect(x, y, w, h);
        }
        rectStartRef.current = null;
        render();
      }

      // Notify mask is ready
      if (onMaskReady && (activeTool === 'brush' || activeTool === 'lasso' || activeTool === 'rectangle')) {
        const maskUrl = getMaskBW();
        if (maskUrl) onMaskReady(maskUrl);
      }
    }, [activeTool, screenToImage, render, onMaskReady]);

    // --- Get black/white mask for AI ---
    const getMaskBW = useCallback((): string | null => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return null;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskCanvas.width;
      tempCanvas.height = maskCanvas.height;
      const ctx = tempCanvas.getContext('2d')!;

      // Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw mask - where there's mask content, make it white
      const maskCtx = maskCanvas.getContext('2d')!;
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const bwData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i + 3] > 10) {
          bwData.data[i] = 255;
          bwData.data[i + 1] = 255;
          bwData.data[i + 2] = 255;
          bwData.data[i + 3] = 255;
        }
      }
      ctx.putImageData(bwData, 0, 0);
      return tempCanvas.toDataURL('image/png');
    }, []);

    // --- Resize observer ---
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const observer = new ResizeObserver(() => {
        if (imageRef.current) render();
      });
      observer.observe(container);
      return () => observer.disconnect();
    }, [render]);

    // --- Custom cursor rendering ---
    const getCursorStyle = useCallback((): string => {
      if (spaceHeldRef.current || isPanningRef.current) return 'grab';
      if (activeTool === 'brush') return 'none';
      if (activeTool === 'lasso' || activeTool === 'rectangle') return 'crosshair';
      return 'default';
    }, [activeTool]);


    // --- Imperative handle ---
    useImperativeHandle(ref, () => ({
      getTransform: () => ({ ...transformRef.current }),
      fitToScreen,
      zoomTo: (scale: number) => {
        const container = containerRef.current;
        if (container) {
          zoom((scale - transformRef.current.scale) / transformRef.current.scale, container.clientWidth / 2, container.clientHeight / 2);
        }
      },
      getMaskDataUrl: getMaskBW,
      clearMask: () => {
        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (maskCtx && maskCanvasRef.current) {
          maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
          render();
        }
      },
    }), [fitToScreen, zoom, getMaskBW, render]);

    // Zoom percentage display
    const zoomPercent = Math.round(displayScale * 100);

    return (
      <div ref={containerRef} className={`relative w-full h-full overflow-hidden bg-void ${className || ''}`}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: getCursorStyle() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            isPanningRef.current = false;
            isDrawingRef.current = false;
          }}
        />

        {/* Hidden mask canvas */}
        <canvas ref={maskCanvasRef} className="hidden" />

        {/* Zoom indicator */}
        <div
          className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-lg px-2 py-1 text-[11px] font-bold text-text-secondary select-none"
          onDoubleClick={fitToScreen}
          title="Dvojklik = přizpůsobit obrazovce"
        >
          <button
            onClick={() => {
              const container = containerRef.current;
              if (container) zoom(-ZOOM_STEP * 2, container.clientWidth / 2, container.clientHeight / 2);
            }}
            className="hover:text-text-primary transition-colors px-0.5"
          >
            −
          </button>
          <span className="min-w-[3rem] text-center">{zoomPercent}%</span>
          <button
            onClick={() => {
              const container = containerRef.current;
              if (container) zoom(ZOOM_STEP * 2, container.clientWidth / 2, container.clientHeight / 2);
            }}
            className="hover:text-text-primary transition-colors px-0.5"
          >
            +
          </button>
        </div>

        {/* Minimap */}
        {displayScale > 1.1 && (
          <div className="absolute bottom-3 right-3 z-30 border border-border-subtle rounded-lg overflow-hidden shadow-lg opacity-80 hover:opacity-100 transition-opacity">
            <canvas ref={minimapCanvasRef} width={MINIMAP_W} height={MINIMAP_H} />
          </div>
        )}

        {/* Brush size cursor indicator (visual only) */}
        {activeTool === 'brush' && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-cyan-400/60"
            style={{
              width: brushSize * displayScale,
              height: brushSize * displayScale,
              transform: 'translate(-50%, -50%)',
              left: cursorPos.x,
              top: cursorPos.y,
            }}
          />
        )}
      </div>
    );
  }
);

CanvasViewport.displayName = 'CanvasViewport';
export default CanvasViewport;
