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
  chandelier: '/assets/vintage-chandelier.svg',
  caesarBust: '/assets/caesar_bust_photo.png',
};

const HIT_ZONES = {
  cabinet: { x: 78, y: 150, w: 232, h: 304 },
  strap: { x: 146, y: 198, w: 82, h: 208 },
  nightstand: { x: 344, y: 332, w: 132, h: 120 },
  painting: { x: 310, y: 108, w: 214, h: 144 },
  handle: { x: 644, y: 270, w: 96, h: 48 },
  lock: { x: 764, y: 288, w: 58, h: 76 },
};

const WALK_TARGETS = {
  cabinet: { x: 210, y: 430, facing: -1 },
  nightstand: { x: 412, y: 432, facing: -1 },
  painting: { x: 440, y: 420, facing: 1 },
  door: { x: 700, y: 424, facing: 1 },
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
  const drawH = height;
  const drawW = Math.min(maxWidth, drawH * ratio);
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

function drawChandelierFlames(
  ctx: CanvasRenderingContext2D,
  frame: number,
  _img: HTMLImageElement | undefined,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
) {
  const rect = { x: boxX, y: boxY, w: boxW, h: boxH };
  const scaleX = rect.w / 720;
  const scaleY = rect.h / 720;
  const scale = Math.min(scaleX, scaleY);
  const flameCenters = [
    [79, 252], [169, 216], [270, 206], [360, 210], [450, 206], [551, 216], [641, 252],
  ];

  ctx.save();
  flameCenters.forEach(([sourceX, sourceY], idx) => {
    const x = rect.x + sourceX * scaleX;
    const y = rect.y + sourceY * scaleY;
    const flicker = 1 + Math.sin(frame * 0.12 + idx * 1.7) * 0.18;

    const glow = ctx.createRadialGradient(x, y + 5, 2, x, y + 7, 22 * scale * flicker);
    glow.addColorStop(0, 'rgba(255, 233, 178, 0.72)');
    glow.addColorStop(0.35, 'rgba(245, 164, 58, 0.34)');
    glow.addColorStop(1, 'rgba(245, 164, 58, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + 7, 26 * scale * flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5a43a';
    ctx.beginPath();
    ctx.moveTo(x, y - 13 * scale * flicker);
    ctx.bezierCurveTo(x - 10 * scale, y - 1 * scale, x - 6 * scale, y + 13 * scale, x, y + 16 * scale);
    ctx.bezierCurveTo(x + 8 * scale, y + 10 * scale, x + 9 * scale, y - 2 * scale, x, y - 13 * scale * flicker);
    ctx.fill();

    ctx.fillStyle = '#fff0b0';
    ctx.beginPath();
    ctx.moveTo(x + 1 * scale, y - 6 * scale * flicker);
    ctx.bezierCurveTo(x - 4 * scale, y + 2 * scale, x - 2 * scale, y + 8 * scale, x + 1 * scale, y + 10 * scale);
    ctx.bezierCurveTo(x + 5 * scale, y + 5 * scale, x + 5 * scale, y + 0 * scale, x + 1 * scale, y - 6 * scale * flicker);
    ctx.fill();
  });
  ctx.restore();
}

function drawStoneRoom(ctx: CanvasRenderingContext2D, frame: number) {
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

  drawArchRecess(ctx, 62, 126, 250, 222, 0.48);
  drawArchRecess(ctx, 288, 86, 250, 224, 0.38);
  drawArchRecess(ctx, 512, 92, 116, 180, 0.42);
  drawArchRecess(ctx, 600, 104, 224, 348, 0.62);

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

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(324, 382);
  ctx.lineTo(660, 382);
  ctx.lineTo(706, 512);
  ctx.lineTo(278, 512);
  ctx.closePath();
  const rug = ctx.createLinearGradient(336, 386, 724, 520);
  rug.addColorStop(0, '#57311d');
  rug.addColorStop(0.52, '#7a3b22');
  rug.addColorStop(1, '#27110b');
  ctx.fillStyle = rug;
  ctx.fill();
  ctx.strokeStyle = 'rgba(215, 184, 109, 0.38)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(245, 211, 145, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(372, 402);
  ctx.lineTo(612, 402);
  ctx.lineTo(660, 494);
  ctx.lineTo(324, 494);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

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

function drawPainting(ctx: CanvasRenderingContext2D, active: boolean, solved: boolean) {
  drawHitOutline(ctx, HIT_ZONES.painting, active, solved);
  ctx.save();
  ctx.translate(-140, 0);
  roundRect(ctx, 450, 108, 214, 142, 12);
  ctx.fillStyle = '#5b3517';
  ctx.fill();
  ctx.strokeStyle = '#b88745';
  ctx.lineWidth = 8;
  ctx.stroke();

  const canvas = ctx.createLinearGradient(468, 126, 646, 232);
  canvas.addColorStop(0, '#2d2530');
  canvas.addColorStop(0.6, '#14121a');
  canvas.addColorStop(1, '#07080f');
  roundRect(ctx, 468, 126, 178, 106, 6);
  ctx.fillStyle = canvas;
  ctx.fill();

  ctx.fillStyle = '#bfa56f';
  ctx.beginPath();
  ctx.arc(557, 158, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c1a0f';
  ctx.beginPath();
  ctx.moveTo(536, 153);
  ctx.quadraticCurveTo(557, 121, 581, 153);
  ctx.lineTo(573, 142);
  ctx.quadraticCurveTo(557, 134, 542, 143);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7c4a22';
  ctx.beginPath();
  ctx.moveTo(524, 222);
  ctx.quadraticCurveTo(557, 180, 590, 222);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = solved ? '#8edc8c' : active ? '#ffe9b2' : '#c8b58c';
  ctx.font = '700 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.translate(37, 5);
  ctx.fillText('РЕИПЯА', 520, 193);
  ctx.font = '700 11px Georgia, serif';
  ctx.fillText('ЧШЮСЭ', 520, 209);
  ctx.restore();
}

function drawDoor(ctx: CanvasRenderingContext2D, activeRiddle: Riddle, scytaleSolved: boolean) {
  const doorActive = activeRiddle === 'scytale' || activeRiddle === 'lock';
  drawHitOutline(ctx, { x: 724, y: 112, w: 220, h: 340 }, doorActive, scytaleSolved);

  ctx.save();
  ctx.translate(-120, 0);
  ctx.fillStyle = 'rgba(4, 2, 1, 0.38)';
  ctx.fillRect(720, 436, 224, 24);

  ctx.beginPath();
  ctx.moveTo(724, 450);
  ctx.lineTo(724, 184);
  ctx.quadraticCurveTo(834, 82, 944, 184);
  ctx.lineTo(944, 450);
  ctx.closePath();
  ctx.fillStyle = 'rgba(11, 7, 4, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(178, 130, 67, 0.34)';
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(746, 446);
  ctx.lineTo(746, 178);
  ctx.quadraticCurveTo(836, 104, 926, 178);
  ctx.lineTo(926, 446);
  ctx.closePath();
  const frame = ctx.createLinearGradient(734, 120, 936, 446);
  frame.addColorStop(0, '#5b3517');
  frame.addColorStop(1, '#26140a');
  ctx.fillStyle = frame;
  ctx.fill();
  ctx.strokeStyle = '#b88745';
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(772, 430);
  ctx.lineTo(772, 196);
  ctx.quadraticCurveTo(836, 140, 900, 196);
  ctx.lineTo(900, 430);
  ctx.closePath();
  const wood = ctx.createLinearGradient(772, 144, 900, 430);
  wood.addColorStop(0, '#58331a');
  wood.addColorStop(0.46, '#321c0e');
  wood.addColorStop(1, '#130904');
  ctx.fillStyle = wood;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 151, 0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(215, 184, 109, 0.18)';
  ctx.lineWidth = 2;
  [792, 836, 880].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 200);
    ctx.lineTo(x, 428);
    ctx.stroke();
  });

  ctx.strokeStyle = scytaleSolved ? '#8edc8c' : '#c08a3f';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(780, 292);
  ctx.lineTo(852, 286);
  ctx.stroke();

  ctx.fillStyle = 'rgba(58, 35, 17, 0.78)';
  roundRect(ctx, 880, 274, 62, 92, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(184, 135, 69, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = activeRiddle === 'lock' ? '#d7b86d' : '#1a1009';
  roundRect(ctx, 888, 296, 44, 58, 7);
  ctx.fill();
  ctx.strokeStyle = '#b88745';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#0a0603';
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(896 + i * 7, 314, 4, 20);
  }
  ctx.fillStyle = '#f7d994';
  ctx.beginPath();
  ctx.arc(910, 344, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(245, 211, 145, 0.16)';
  ctx.fillRect(746, 446, 198, 4);
  ctx.restore();
}

function drawArsen(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number, walking: boolean, frame: number) {
  ctx.save();
  ctx.translate(x, y);
  const heroScale = 1.14;
  ctx.scale(facing * heroScale, heroScale);

  const bob = walking ? Math.sin(frame * 0.24) * 2.5 : Math.sin(frame * 0.035) * 1.2;
  ctx.translate(0, bob);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 42, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2b1a0e';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const legSwing = walking ? Math.sin(frame * 0.24) * 7 : 0;
  ctx.beginPath();
  ctx.moveTo(-8, 18);
  ctx.lineTo(-13 - legSwing * 0.25, 39);
  ctx.moveTo(8, 18);
  ctx.lineTo(12 + legSwing * 0.25, 39);
  ctx.stroke();

  const cloak = ctx.createLinearGradient(0, -10, 0, 34);
  cloak.addColorStop(0, '#384053');
  cloak.addColorStop(1, '#151923');
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.moveTo(-20, 25);
  ctx.quadraticCurveTo(0, -16, 20, 25);
  ctx.lineTo(12, 34);
  ctx.lineTo(-13, 34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a6124';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = '#d0b084';
  ctx.lineWidth = 5;
  const armSwing = walking ? Math.sin(frame * 0.24) * 6 : 0;
  ctx.beginPath();
  ctx.moveTo(-15, 1);
  ctx.lineTo(-25, 17 + armSwing * 0.3);
  ctx.moveTo(15, 2);
  ctx.lineTo(24, 14 - armSwing * 0.3);
  ctx.stroke();

  ctx.fillStyle = '#d7b086';
  ctx.beginPath();
  ctx.arc(0, -22, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c1a0f';
  ctx.beginPath();
  ctx.moveTo(-16, -27);
  ctx.quadraticCurveTo(0, -46, 17, -28);
  ctx.quadraticCurveTo(4, -31, -12, -21);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2f2118';
  ctx.beginPath();
  ctx.arc(6, -22, 2, 0, Math.PI * 2);
  ctx.fill();

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
  const heroRef = useRef({ x: 515, y: 432, targetX: 515, targetY: 432, facing: 1 });

  const sendHeroTo = (target: keyof typeof WALK_TARGETS) => {
    const hero = heroRef.current;
    hero.targetX = WALK_TARGETS[target].x;
    hero.targetY = WALK_TARGETS[target].y;
    hero.facing = WALK_TARGETS[target].facing;
  };

  const sendHeroToPoint = (point: { x: number; y: number }) => {
    const hero = heroRef.current;
    const floorPoint = getFloorWalkPoint(point);
    hero.targetX = floorPoint.x;
    hero.targetY = floorPoint.y;
    if (Math.abs(floorPoint.x - hero.x) > 1) {
      hero.facing = floorPoint.x > hero.x ? 1 : -1;
    }
  };

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
      const img = new Image();
      img.src = src;
      images[key] = img;
    });

    let frame = 0;
    let animationId = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

      const hero = heroRef.current;
      const dx = hero.targetX - hero.x;
      const dy = hero.targetY - hero.y;
      const walking = Math.abs(dx) > 1 || Math.abs(dy) > 1;
      hero.x += dx * 0.075;
      hero.y += dy * 0.075;
      if (Math.abs(dx) > 1) hero.facing = dx > 0 ? 1 : -1;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      drawStoneRoom(ctx, frame);
      drawWindow(ctx, frame);
      if (images.chandelier?.complete && images.chandelier.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(images.chandelier, 292, -44, 400, 190);
        ctx.restore();
      }
      void drawChandelierFlames;

      drawPainting(ctx, activeRiddle === 'vigenere', vigenereSolved);
      drawDoor(ctx, activeRiddle, scytaleSolved);

      drawHitOutline(ctx, HIT_ZONES.cabinet, cabinetOpen || activeRiddle === 'scytale', strapTaken);
      if (cabinetOpen) {
        drawImageCropped(ctx, images.closetOpened, 0, 0, 512, 811, 78, 150, 232, 304);
      } else {
        drawImageCropped(ctx, images.closetClosed, 122, 70, 476, 821, 78, 150, 232, 304);
      }
      if (cabinetOpen && !strapTaken) {
        ctx.save();
        ctx.strokeStyle = '#7a4a22';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(178, 218);
        ctx.bezierCurveTo(142, 270, 194, 326, 158, 388);
        ctx.stroke();
        ctx.strokeStyle = '#d7b86d';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      drawHitOutline(ctx, HIT_ZONES.nightstand, activeRiddle === 'caesar', caesarSolved);
      drawImageFit(ctx, drawerOpen ? images.drawerOpened : images.drawerClosed, 346, 336, 130, 112);
      drawHitOutline(ctx, { x: 364, y: 236, w: 92, h: 108 }, activeRiddle === 'caesar', caesarSolved);
      drawImageFixedHeight(ctx, images.caesarBust, 412, 344, 90, 66);

      drawArsen(ctx, hero.x, hero.y, hero.facing, walking, frame);

      ctx.restore();
      animationId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [activeRiddle, cabinetOpen, drawerOpen, strapTaken, caesarSolved, vigenereSolved, scytaleSolved]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      className="h-full w-full cursor-pointer rounded-md bg-[#130d09]"
      aria-label="Кабинет шифровальщика с Арсеном и интерактивными предметами"
    />
  );
}
