import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

type Riddle = 'caesar' | 'vigenere' | 'scytale' | 'lock' | null;

type StudyViewCanvasProps = {
  activeRiddle: Riddle;
  cabinetOpen: boolean;
  drawerOpen: boolean;
  strapTaken: boolean;
  caesarSolved: boolean;
  vigenereSolved: boolean;
  scytaleSolved: boolean;
  onCabinetClick: () => void;
  onTakeStrap: () => void;
  onNightstandClick: () => void;
  onPaintingClick: () => void;
  onDoorHandleClick: () => void;
  onLockClick: () => void;
};

const SCENE_W = 960;
const SCENE_H = 540;

const ASSETS = {
  closetClosed: '/assets/closet_closed.svg',
  closetOpened: '/assets/closet_opened.svg',
  drawerClosed: '/assets/drawer_closed.svg',
  drawerOpened: '/assets/drawer_opened.svg',
  rug: '/assets/vintage-floor-rug.svg',
  painting: '/assets/vintage-painting-text.svg',
  chandelier: '/assets/vintage-chandelier-transparent.gif',
  door: '/assets/vintage-door.svg',
  keypadLock: '/assets/vintage-keypad-lock.svg',
  caesarBust: '/assets/caesar_bust_new.png',
};

const CHANDELIER_RECT = { x: 354, y: -42, w: 252, h: 252 };

const HIT_ZONES = {
  cabinet: { x: 84, y: 80, w: 216, h: 286 },
  strap: { x: 146, y: 130, w: 76, h: 196 },
  nightstand: { x: 350, y: 238, w: 150, h: 128 },
  painting: { x: 500, y: 106, w: 148, h: 134 },
  handle: { x: 744, y: 224, w: 64, h: 84 },
  lock: { x: 790, y: 196, w: 58, h: 84 },
};

const WALK_TARGETS = {
  cabinet: { x: 204, y: 366, facing: -1 },
  nightstand: { x: 428, y: 368, facing: -1 },
  painting: { x: 566, y: 420, facing: 1 },
  door: { x: 772, y: 424, facing: 1 },
};

function getFloorWalkPoint(point: { x: number; y: number }) {
  const minY = 360;
  const maxY = 490;
  const y = Math.max(minY, Math.min(maxY, point.y));
  const t = (y - 348) / (526 - 348);
  const left = 28 + (92 - 28) * t + 38;
  const right = 932 + (870 - 932) * t - 38;

  return {
    x: Math.max(left, Math.min(right, point.x)),
    y,
  };
}

function isFloorPoint(point: { x: number; y: number }) {
  if (point.y < 348 || point.y > 526) return false;
  const t = (point.y - 348) / (526 - 348);
  const left = 28 + (92 - 28) * t;
  const right = 932 + (870 - 932) * t;
  return point.x >= left && point.x <= right;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function imageFitRect(img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  const drawW = ratio > boxRatio ? w : h * ratio;
  const drawH = ratio > boxRatio ? w / ratio : h;
  return {
    x: x + (w - drawW) / 2,
    y: y + (h - drawH) / 2,
    w: drawW,
    h: drawH,
  };
}

function drawImageFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 1,
) {
  if (!img?.complete || !img.naturalWidth) return;
  const rect = imageFitRect(img, x, y, w, h);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawImageFixedHeight(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  centerX: number,
  bottomY: number,
  height: number,
  maxWidth: number,
  alpha = 1,
) {
  if (!img?.complete || !img.naturalWidth) return;
  const ratio = img.naturalWidth / img.naturalHeight;
  let drawH = height;
  let drawW = drawH * ratio;
  if (drawW > maxWidth) {
    drawW = maxWidth;
    drawH = drawW / ratio;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, centerX - drawW / 2, bottomY - drawH, drawW, drawH);
  ctx.restore();
}

function drawImageCropped(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 1,
) {
  if (!img?.complete || !img.naturalWidth) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}


type AnimatedGifFrame = {
  canvas: HTMLCanvasElement;
  duration: number;
};

type ImageDecoderFrame = {
  image: CanvasImageSource & { close?: () => void };
};

type ImageDecoderLike = {
  tracks: { ready: Promise<void>; selectedTrack?: { frameCount?: number } };
  decode: (options: { frameIndex: number }) => Promise<ImageDecoderFrame>;
  close?: () => void;
};

type ImageDecoderConstructor = new (options: { data: ReadableStream<Uint8Array>; type: string }) => ImageDecoderLike;

const getImageDecoder = () => (window as typeof window & { ImageDecoder?: ImageDecoderConstructor }).ImageDecoder;

async function loadAnimatedGifFrames(
  src: string,
  signal: AbortSignal,
  onFrame?: (frame: AnimatedGifFrame) => void,
) {
  const ImageDecoder = getImageDecoder();
  if (!ImageDecoder) return [];

  const response = await fetch(src, { signal });
  const body = response.body;
  if (!body) return [];

  const decoder = new ImageDecoder({ data: body, type: 'image/gif' });
  await decoder.tracks.ready;
  const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;
  const frames: AnimatedGifFrame[] = [];

  for (let i = 0; i < frameCount && !signal.aborted; i += 1) {
    const { image } = await decoder.decode({ frameIndex: i });
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = 720;
    frameCanvas.height = 720;
    const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
    if (!frameCtx) continue;

    frameCtx.drawImage(image, 0, 0, frameCanvas.width, frameCanvas.height);
    image.close?.();

    const gifFrame = { canvas: frameCanvas, duration: 90 };
    frames.push(gifFrame);
    onFrame?.(gifFrame);
  }

  decoder.close?.();
  return frames;
}


async function loadStaticGifFrame(src: string, signal: AbortSignal) {
  return new Promise<AnimatedGifFrame[]>((resolve) => {
    if (signal.aborted) {
      resolve([]);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = image.naturalWidth || 720;
      frameCanvas.height = image.naturalHeight || 720;
      const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
      if (!frameCtx) {
        resolve([]);
        return;
      }

      frameCtx.drawImage(image, 0, 0, frameCanvas.width, frameCanvas.height);
      resolve([{ canvas: frameCanvas, duration: 90 }]);
    };
    image.onerror = () => resolve([]);
    image.src = src;
  });
}

function getAnimatedGifFrame(frames: AnimatedGifFrame[], elapsed: number) {
  if (!frames.length) return null;
  const totalDuration = frames.reduce((sum, frame) => sum + frame.duration, 0);
  let time = elapsed % totalDuration;
  for (const frame of frames) {
    if (time < frame.duration) return frame.canvas;
    time -= frame.duration;
  }
  return frames[0].canvas;
}

function drawChandelierFrame(ctx: CanvasRenderingContext2D, frame: HTMLCanvasElement | null) {
  if (!frame) return;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(frame, CHANDELIER_RECT.x, CHANDELIER_RECT.y, CHANDELIER_RECT.w, CHANDELIER_RECT.h);
  ctx.restore();
}

function drawHitOutline(ctx: CanvasRenderingContext2D, zone: { x: number; y: number; w: number; h: number }, active: boolean, solved = false) {
  void ctx;
  void zone;
  void active;
  void solved;
}

function drawArchRecess(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.34);
  ctx.quadraticCurveTo(x + w / 2, y - h * 0.18, x + w, y + h * 0.34);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(11, 7, 4, 0.54)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(178, 130, 67, 0.38)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 222, 156, 0.09)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawStoneRoom(ctx: CanvasRenderingContext2D, frame: number, rugImage: HTMLImageElement | undefined) {
  const wall = ctx.createLinearGradient(0, 20, 960, 380);
  wall.addColorStop(0, '#342416');
  wall.addColorStop(0.48, '#20150d');
  wall.addColorStop(1, '#0f0905');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);

  ctx.save();
  for (let row = 0; row < 8; row += 1) {
    const blockH = row % 2 === 0 ? 42 : 38;
    const y = 28 + row * 39;
    const offset = row % 2 === 0 ? -24 : 18;
    for (let x = offset; x < SCENE_W; x += 92) {
      const shade = 22 + ((row + Math.floor((x + 80) / 92)) % 4) * 5;
      ctx.fillStyle = `rgba(${shade + 28}, ${shade + 19}, ${shade + 11}, 0.58)`;
      roundRect(ctx, x, y, 86, blockH, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(112, 75, 37, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.save();
  const pillar = ctx.createLinearGradient(0, 70, 0, 352);
  pillar.addColorStop(0, '#5a3b1d');
  pillar.addColorStop(0.55, '#2f1d0f');
  pillar.addColorStop(1, '#160b05');
  [36, 318, 888].forEach((x) => {
    ctx.fillStyle = pillar;
    roundRect(ctx, x, 74, 30, 276, 8);
    ctx.fill();
    ctx.fillStyle = '#7d5528';
    roundRect(ctx, x - 8, 62, 46, 18, 5);
    ctx.fill();
    roundRect(ctx, x - 10, 344, 50, 20, 5);
    ctx.fill();
  });
  ctx.restore();

  const light = ctx.createRadialGradient(492, 64, 18, 492, 142, 520);
  light.addColorStop(0, 'rgba(255, 229, 164, 0.42)');
  light.addColorStop(0.38, 'rgba(188, 123, 48, 0.16)');
  light.addColorStop(1, 'rgba(20, 12, 7, 0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);

  const floor = ctx.createLinearGradient(0, 350, 0, 540);
  floor.addColorStop(0, '#5b351d');
  floor.addColorStop(0.42, '#372010');
  floor.addColorStop(1, '#130905');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 348, SCENE_W, 192);

  ctx.save();
  for (let y = 354; y < 540; y += 26) {
    const plank = ctx.createLinearGradient(0, y, 0, y + 24);
    plank.addColorStop(0, 'rgba(144, 92, 43, 0.22)');
    plank.addColorStop(1, 'rgba(44, 25, 12, 0.28)');
    ctx.fillStyle = plank;
    ctx.fillRect(0, y, SCENE_W, 24);
    ctx.strokeStyle = 'rgba(245, 211, 145, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCENE_W, y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(23, 11, 5, 0.28)';
    for (let x = (y % 52 === 0 ? 58 : 14); x < SCENE_W; x += 132) {
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x, y + 22);
      ctx.stroke();
    }
  }
  ctx.restore();

  drawImageFit(ctx, rugImage, 158, 328, 660, 224, 0.98);

  const fog = ctx.createLinearGradient(0, 430, 0, 540);
  fog.addColorStop(0, 'rgba(214, 162, 94, 0)');
  fog.addColorStop(1, 'rgba(214, 162, 94, 0.08)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 430, SCENE_W, 110);

  ctx.save();
  ctx.globalAlpha = 0.04 + Math.sin(frame * 0.025) * 0.015;
  ctx.fillStyle = '#ffd68a';
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  ctx.restore();
}

function drawWindow(ctx: CanvasRenderingContext2D, frame: number) {
  const x = 532;
  const y = 112;
  const w = 70;
  const h = 126;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.fillRect(x - 10, y + h + 2, w + 20, 12);

  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + 34);
  ctx.quadraticCurveTo(x + w / 2, y - 34, x + w, y + 34);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  const sky = ctx.createLinearGradient(x, y - 12, x + w, y + h);
  sky.addColorStop(0, '#12223d');
  sky.addColorStop(1, '#020617');
  ctx.fillStyle = sky;
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 139, 82, 0.82)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 222, 156, 0.16)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = `rgba(226, 232, 240, ${0.62 + Math.sin(frame * 0.032) * 0.12})`;
  ctx.beginPath();
  ctx.arc(x + 53, y + 34, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(147, 197, 253, 0.56)';
  [[12, 46], [24, 26], [42, 84], [60, 108], [16, 116]].forEach(([dotX, dotY], idx) => {
    ctx.globalAlpha = 0.45 + Math.sin(frame * 0.04 + idx) * 0.2;
    ctx.fillRect(x + dotX, y + dotY, 2, 2);
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(4, 8, 16, 0.82)';
  ctx.fillRect(x + 28, y + 82, 18, 54);
  ctx.fillRect(x + 22, y + 90, 30, 8);

  ctx.fillStyle = '#8a6124';
  roundRect(ctx, x - 11, y + h - 2, w + 22, 12, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(245, 211, 145, 0.22)';
  ctx.fillRect(x - 7, y + h, w + 14, 2);
  ctx.restore();
}

function drawPainting(
  ctx: CanvasRenderingContext2D,
  active: boolean,
  solved: boolean,
  paintingImage: HTMLImageElement | undefined,
) {
  drawHitOutline(ctx, HIT_ZONES.painting, active, solved);
  drawImageFit(ctx, paintingImage, 492, 94, 168, 150, 0.98);
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  activeRiddle: Riddle,
  scytaleSolved: boolean,
  doorImage: HTMLImageElement | undefined,
  keypadLockImage: HTMLImageElement | undefined,
) {
  const doorActive = activeRiddle === 'scytale' || activeRiddle === 'lock';
  drawHitOutline(ctx, { x: 642, y: 94, w: 176, h: 262 }, doorActive, scytaleSolved);

  ctx.save();
  ctx.fillStyle = 'rgba(4, 2, 1, 0.24)';
  ctx.fillRect(646, 346, 166, 10);
  drawImageFit(ctx, doorImage, 632, 92, 196, 264, 0.96);

  if (activeRiddle === 'lock') {
    ctx.save();
    ctx.shadowColor = 'rgba(215, 184, 109, 0.38)';
    ctx.shadowBlur = 12;
    drawImageFit(ctx, keypadLockImage, 788, 192, 62, 90, 1);
    ctx.restore();
  } else {
    drawImageFit(ctx, keypadLockImage, 788, 192, 62, 90, 0.96);
  }
  ctx.restore();
}

function getScenePoint(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / SCENE_W, rect.height / SCENE_H);
  const ox = (rect.width - SCENE_W * scale) / 2;
  const oy = (rect.height - SCENE_H * scale) / 2;
  return {
    x: (event.clientX - rect.left - ox) / scale,
    y: (event.clientY - rect.top - oy) / scale,
  };
}

function inZone(point: { x: number; y: number }, zone: { x: number; y: number; w: number; h: number }) {
  return point.x >= zone.x && point.x <= zone.x + zone.w && point.y >= zone.y && point.y <= zone.y + zone.h;
}

export default function StudyViewCanvas({
  activeRiddle,
  cabinetOpen,
  drawerOpen,
  strapTaken,
  caesarSolved,
  vigenereSolved,
  scytaleSolved,
  onCabinetClick,
  onTakeStrap,
  onNightstandClick,
  onPaintingClick,
  onDoorHandleClick,
  onLockClick,
}: StudyViewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chandelierFramesRef = useRef<AnimatedGifFrame[]>([]);
  const sceneStartedAtRef = useRef(performance.now());


  const sendHeroTo = (_target: keyof typeof WALK_TARGETS) => {};

  const sendHeroToPoint = (_point: { x: number; y: number }) => {};

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getScenePoint(canvas, event);

    if (cabinetOpen && !strapTaken && inZone(point, HIT_ZONES.strap)) {
      sendHeroTo('cabinet');
      onTakeStrap();
      return;
    }
    if (inZone(point, HIT_ZONES.lock)) {
      sendHeroTo('door');
      onLockClick();
      return;
    }
    if (inZone(point, HIT_ZONES.handle)) {
      sendHeroTo('door');
      onDoorHandleClick();
      return;
    }
    if (inZone(point, HIT_ZONES.painting)) {
      sendHeroTo('painting');
      onPaintingClick();
      return;
    }
    if (inZone(point, HIT_ZONES.nightstand)) {
      sendHeroTo('nightstand');
      onNightstandClick();
      return;
    }
    if (inZone(point, HIT_ZONES.cabinet)) {
      sendHeroTo('cabinet');
      onCabinetClick();
      return;
    }
    if (isFloorPoint(point)) {
      sendHeroToPoint(point);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const images: Partial<Record<keyof typeof ASSETS, HTMLImageElement>> = {};
    (Object.entries(ASSETS) as Array<[keyof typeof ASSETS, string]>).forEach(([key, src]) => {
      if (key === 'chandelier') return;
      const img = new Image();
      img.src = src;
      images[key] = img;
    });

    const gifAbortController = new AbortController();
    chandelierFramesRef.current = [];
    void loadAnimatedGifFrames(ASSETS.chandelier, gifAbortController.signal, (gifFrame) => {
      if (!gifAbortController.signal.aborted) {
        chandelierFramesRef.current = [...chandelierFramesRef.current, gifFrame];
      }
    })
      .then((frames) => (frames.length ? frames : loadStaticGifFrame(ASSETS.chandelier, gifAbortController.signal)))
      .then((frames) => {
        if (!gifAbortController.signal.aborted && !chandelierFramesRef.current.length) {
          chandelierFramesRef.current = frames;
        }
      });

    let frame = 0;
    let animationId = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = Math.min(rect.width / SCENE_W, rect.height / SCENE_H);
      void scale;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = () => {
      frame += 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const scale = Math.min(w / SCENE_W, h / SCENE_H);
      const ox = (w - SCENE_W * scale) / 2;
      const oy = (h - SCENE_H * scale) / 2;



      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      drawStoneRoom(ctx, frame, images.rug);
      drawPainting(ctx, activeRiddle === 'vigenere', vigenereSolved, images.painting);
      drawDoor(ctx, activeRiddle, scytaleSolved, images.door, images.keypadLock);

      drawHitOutline(ctx, HIT_ZONES.cabinet, cabinetOpen || activeRiddle === 'scytale', strapTaken);
      if (cabinetOpen) {
        drawImageCropped(ctx, images.closetOpened, 0, 0, 512, 811, 84, 80, 216, 286);
      } else {
        drawImageCropped(ctx, images.closetClosed, 122, 70, 476, 821, 84, 80, 216, 286);
      }
      if (cabinetOpen && !strapTaken) {
        ctx.save();
        ctx.strokeStyle = '#7a4a22';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(174, 150);
        ctx.bezierCurveTo(142, 200, 190, 254, 160, 316);
        ctx.stroke();
        ctx.strokeStyle = '#d7b86d';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      drawHitOutline(ctx, HIT_ZONES.nightstand, activeRiddle === 'caesar', caesarSolved);
      drawImageFit(ctx, drawerOpen ? images.drawerOpened : images.drawerClosed, 350, 238, 150, 128);
      drawHitOutline(ctx, { x: 370, y: 136, w: 112, h: 116 }, activeRiddle === 'caesar', caesarSolved);
      drawImageFixedHeight(ctx, images.caesarBust, 425, 270, 82, 144);

      drawChandelierFrame(ctx, getAnimatedGifFrame(chandelierFramesRef.current, performance.now() - sceneStartedAtRef.current));

      ctx.restore();
      animationId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      gifAbortController.abort();
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [activeRiddle, cabinetOpen, drawerOpen, strapTaken, caesarSolved, vigenereSolved, scytaleSolved]);
  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      className="h-full w-full cursor-pointer rounded-md bg-[#130d09]"
      aria-label="Interactive cryptographer study with Arsen and clickable objects"
    />
  );
}
