/**
 * Runtime generation of the badge artwork: front face, back face (QR), and
 * the lanyard band texture. Everything is drawn onto canvases from local
 * assets + data — no external art. Used by both the 3D badge (as WebGL
 * textures) and available to the 2.5D fallback.
 */
import QRCode from "qrcode";
import { assets, links, profile, qrTarget } from "@/content/content";

export const CARD_W = 1024;
export const CARD_H = 1440; // matches 3D card aspect (1.6 : 2.25)
export const BAND_W = 1024;
export const BAND_H = 128;

/** UV-space rects (origin bottom-left, like three.js UVs) for clickable regions on the front. */
export interface UvRegion {
  name: "github" | "linkedin";
  href: string;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface BadgeArt {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  band: HTMLCanvasElement;
  frontRegions: UvRegion[];
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // graceful fallback → text wordmark
    img.src = src;
  });
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Base card: near-black glossy slab with edge light and subtle texture. */
function drawCardBase(ctx: CanvasRenderingContext2D) {
  const w = CARD_W;
  const h = CARD_H;

  // Deep base
  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, "#14161d");
  base.addColorStop(0.5, "#0c0e13");
  base.addColorStop(1, "#101319");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Diagonal gloss sheen
  const sheen = ctx.createLinearGradient(0, 0, w * 1.2, h * 0.9);
  sheen.addColorStop(0, "rgba(255,255,255,0.10)");
  sheen.addColorStop(0.25, "rgba(255,255,255,0.02)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  sheen.addColorStop(0.75, "rgba(255,255,255,0.03)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Fine diagonal micro-lines (carbon feel, very subtle)
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let i = -h; i < w; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
    ctx.stroke();
  }
  ctx.restore();

  // Edge light
  roundedRectPath(ctx, 6, 6, w - 12, h - 12, 46);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 3;
  ctx.stroke();
  roundedRectPath(ctx, 14, 14, w - 28, h - 28, 40);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lanyard slot near top
  const slotW = 220;
  const slotH = 34;
  roundedRectPath(ctx, (w - slotW) / 2, 54, slotW, slotH, 17);
  ctx.fillStyle = "#04050a";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

const DISPLAY = "'Space Grotesk', 'Segoe UI', system-ui, sans-serif";

/** Draw an image inverted-with-hue-preserved so dark logos read on the dark card. */
function drawLogoOnDark(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.filter = "invert(1) hue-rotate(180deg)";
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

function drawFront(
  ctx: CanvasRenderingContext2D,
  respawn: HTMLImageElement | null,
  ea: HTMLImageElement | null,
): UvRegion[] {
  const w = CARD_W;
  const h = CARD_H;
  drawCardBase(ctx);

  // ---- Respawn logo at the top (fallback: wordmark) ----
  if (respawn) {
    const lw = 460;
    const lh = (respawn.height / respawn.width) * lw;
    drawLogoOnDark(ctx, respawn, (w - lw) / 2, 150, lw, lh);
  } else {
    ctx.fillStyle = "#e8eaf0";
    ctx.font = `700 74px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText("RESPAWN", w / 2, 220);
  }

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, 330);
  ctx.lineTo(w - 140, 330);
  ctx.stroke();

  ctx.textAlign = "center";

  // ---- Identity block ----
  ctx.fillStyle = "#f4f5f8";
  ctx.font = `700 118px ${DISPLAY}`;
  ctx.fillText(profile.name, w / 2, 560);

  ctx.fillStyle = "#b9bfcc";
  ctx.font = `500 52px ${DISPLAY}`;
  ctx.fillText(profile.title, w / 2, 660);

  ctx.fillStyle = "#f26722"; // ember accent derived from Respawn art
  ctx.font = `600 44px ${DISPLAY}`;
  ctx.fillText(profile.taglineRole.toUpperCase(), w / 2, 745);

  ctx.fillStyle = "#8b93a5";
  ctx.font = `500 40px ${DISPLAY}`;
  ctx.fillText(profile.studio, w / 2, 830);

  // Access-pass stripe
  ctx.save();
  ctx.fillStyle = "rgba(37,90,246,0.14)"; // signal accent derived from EA art
  roundedRectPath(ctx, 140, 905, w - 280, 74, 37);
  ctx.fill();
  ctx.strokeStyle = "rgba(37,90,246,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#9db4f5";
  ctx.font = `600 34px ${DISPLAY}`;
  ctx.letterSpacing = "14px";
  ctx.fillText("ALL-AREA ACCESS · GAME AI · QA", w / 2 + 7, 955);
  ctx.letterSpacing = "0px";
  ctx.restore();

  // ---- Link chips (GitHub / LinkedIn) — clickable UV regions ----
  const regions: UvRegion[] = [];
  const chipY = 1070;
  const chipH = 96;
  const chipW = 350;
  const gap = 40;
  const startX = (w - (chipW * 2 + gap)) / 2;

  const chips: { name: "github" | "linkedin"; mono: string; label: string; href: string }[] = [
    { name: "github", mono: "GH", label: "lwt0000", href: links.github },
    { name: "linkedin", mono: "in", label: "wentao-lu", href: links.linkedin },
  ];

  chips.forEach((chip, i) => {
    const x = startX + i * (chipW + gap);
    roundedRectPath(ctx, x, chipY, chipW, chipH, 26);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // monogram square
    roundedRectPath(ctx, x + 16, chipY + 16, chipH - 32, chipH - 32, 14);
    ctx.fillStyle = chip.name === "github" ? "#e8eaf0" : "#0a66c2";
    ctx.fill();
    ctx.fillStyle = chip.name === "github" ? "#0b0c10" : "#ffffff";
    ctx.font = `700 40px ${DISPLAY}`;
    ctx.fillText(chip.mono, x + 16 + (chipH - 32) / 2, chipY + chipH / 2 + 14);

    ctx.fillStyle = "#d7dbe4";
    ctx.font = `600 40px ${DISPLAY}`;
    ctx.textAlign = "left";
    ctx.fillText(chip.label, x + chipH + 4, chipY + chipH / 2 + 14);
    ctx.textAlign = "center";

    regions.push({
      name: chip.name,
      href: chip.href,
      u0: x / w,
      u1: (x + chipW) / w,
      // canvas y grows downward; UV v grows upward
      v0: 1 - (chipY + chipH) / h,
      v1: 1 - chipY / h,
    });
  });

  // Hint
  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.font = `500 30px ${DISPLAY}`;
  ctx.fillText("TAP CARD TO FLIP", w / 2, 1250);

  // ---- EA logo bottom-right (fallback: wordmark) ----
  if (ea) {
    ctx.drawImage(ea, w - 210, h - 210, 120, 120);
  } else {
    ctx.fillStyle = "#255af6";
    ctx.font = `700 64px ${DISPLAY}`;
    ctx.fillText("EA", w - 150, h - 120);
  }

  // Holo dot bottom-left
  const holo = ctx.createRadialGradient(150, h - 150, 4, 150, h - 150, 46);
  holo.addColorStop(0, "rgba(242,103,34,0.85)");
  holo.addColorStop(0.6, "rgba(37,90,246,0.4)");
  holo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = holo;
  ctx.beginPath();
  ctx.arc(150, h - 150, 46, 0, Math.PI * 2);
  ctx.fill();

  return regions;
}

async function drawBack(
  ctx: CanvasRenderingContext2D,
  respawn: HTMLImageElement | null,
  ea: HTMLImageElement | null,
) {
  const w = CARD_W;
  const h = CARD_H;
  drawCardBase(ctx);

  // QR panel — light so any scanner reads it
  const qrSize = 520;
  const panel = 620;
  const px = (w - panel) / 2;
  const py = 300;
  roundedRectPath(ctx, px, py, panel, panel, 44);
  ctx.fillStyle = "#f2f3f6";
  ctx.fill();

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, qrTarget, {
    width: qrSize,
    margin: 0,
    color: { dark: "#0b0c10", light: "#f2f3f6" },
    errorCorrectionLevel: "M",
  });
  ctx.drawImage(qrCanvas, (w - qrSize) / 2, py + (panel - qrSize) / 2, qrSize, qrSize);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e8eaf0";
  ctx.font = `700 62px ${DISPLAY}`;
  ctx.letterSpacing = "22px";
  ctx.fillText("SCAN PROFILE", w / 2 + 11, py + panel + 130);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#8b93a5";
  ctx.font = `500 38px ${DISPLAY}`;
  ctx.fillText("→ LinkedIn · Wentao Lu", w / 2, py + panel + 200);

  ctx.fillStyle = "#697083";
  ctx.font = `500 34px ${DISPLAY}`;
  ctx.fillText(links.websiteLabel, w / 2, py + panel + 262);

  // Small co-branding at the bottom
  if (respawn) {
    const lw = 300;
    const lh = (respawn.height / respawn.width) * lw;
    drawLogoOnDark(ctx, respawn, (w - lw) / 2 - 60, h - 170 - lh / 2, lw, lh);
  } else {
    ctx.fillStyle = "#9aa1b0";
    ctx.font = `700 44px ${DISPLAY}`;
    ctx.fillText("RESPAWN", w / 2 - 80, h - 150);
  }
  if (ea) {
    ctx.drawImage(ea, w / 2 + 220, h - 218, 96, 96);
  } else {
    ctx.fillStyle = "#255af6";
    ctx.font = `700 48px ${DISPLAY}`;
    ctx.fillText("EA", w / 2 + 260, h - 150);
  }
}

/** Lanyard band: repeating RESPAWN ENTERTAINMENT like branded fabric. */
function drawBand(ctx: CanvasRenderingContext2D) {
  const w = BAND_W;
  const h = BAND_H;

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#1a1d26");
  base.addColorStop(0.5, "#242835");
  base.addColorStop(1, "#161922");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // woven stitching lines along the edges
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(w, 12);
  ctx.moveTo(0, h - 12);
  ctx.lineTo(w, h - 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 54px ${DISPLAY}`;

  const unit = "RESPAWN ENTERTAINMENT";
  const sep = "  ◆  ";
  const unitWidth = ctx.measureText(unit + sep).width;
  let x = 0;
  while (x < w + unitWidth) {
    ctx.fillStyle = "#dfe3ec";
    ctx.fillText(unit, x, h / 2 + 2);
    const uw = ctx.measureText(unit).width;
    ctx.fillStyle = "#f26722";
    ctx.fillText(sep, x + uw, h / 2 + 2);
    x += unitWidth;
  }
}

let cached: Promise<BadgeArt> | null = null;

/** Generate (once) all badge art. Safe to call from any client component. */
export function getBadgeArt(): Promise<BadgeArt> {
  if (!cached) {
    cached = (async () => {
      const [respawn, ea] = await Promise.all([
        loadImage(assets.respawnLogo),
        loadImage(assets.eaLogo),
      ]);

      const front = document.createElement("canvas");
      front.width = CARD_W;
      front.height = CARD_H;
      const frontRegions = drawFront(front.getContext("2d")!, respawn, ea);

      const back = document.createElement("canvas");
      back.width = CARD_W;
      back.height = CARD_H;
      await drawBack(back.getContext("2d")!, respawn, ea);

      const band = document.createElement("canvas");
      band.width = BAND_W;
      band.height = BAND_H;
      drawBand(band.getContext("2d")!);

      return { front, back, band, frontRegions };
    })();
  }
  return cached;
}
