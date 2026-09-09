import type { AgentVisualStatus } from "@/gateway/types";
import i18n from "@/i18n";

export const SVG_WIDTH = 1200;
export const SVG_HEIGHT = 700;

// Unified office floor plan: one building shell with internal partitions
export const OFFICE = {
  x: 30,
  y: 20,
  width: SVG_WIDTH - 60,
  height: SVG_HEIGHT - 40,
  wallThickness: 6,
  cornerRadius: 18,
  corridorWidth: 28,
} as const;

const halfW = (OFFICE.width - OFFICE.corridorWidth) / 2;
const halfH = (OFFICE.height - OFFICE.corridorWidth) / 2;
const rightX = OFFICE.x + halfW + OFFICE.corridorWidth;
const bottomY = OFFICE.y + halfH + OFFICE.corridorWidth;

export const ZONES = {
  desk: { x: OFFICE.x, y: OFFICE.y, width: halfW, height: halfH, label: "고정 업무 구역" },
  meeting: { x: rightX, y: OFFICE.y, width: halfW, height: halfH, label: "회의실" },
  hotDesk: { x: OFFICE.x, y: bottomY, width: halfW, height: halfH, label: "임시 업무 구역" },
  lounge: { x: rightX, y: bottomY, width: halfW, height: halfH, label: "휴게 공간" },
} as const;

export const CORRIDOR_ENTRANCE = {
  x: ZONES.lounge.x + ZONES.lounge.width / 2,
  y: OFFICE.y + OFFICE.height - 30,
} as const;

export const CORRIDOR_CENTER = {
  x: OFFICE.x + OFFICE.width / 2,
  y: OFFICE.y + OFFICE.height / 2,
} as const;

export const ZONE_COLORS = {
  desk: "#f5e9cf",
  meeting: "#f1e4cf",
  hotDesk: "#f2e5c9",
  lounge: "#f0e2d2",
  corridor: "#e7ddc9",
  wall: "#8a6f4e",
} as const;

export const ZONE_COLORS_DARK = {
  desk: "#2b251a",
  meeting: "#272218",
  hotDesk: "#29231a",
  lounge: "#2b2420",
  corridor: "#1d1812",
  wall: "#5a4730",
} as const;

export const A2A_TOOL_NAMES = new Set([
  "sessions_send",
  "sessions_spawn",
  "session_message",
  "sessions_create",
]);

export const STATUS_COLORS: Record<AgentVisualStatus, string> = {
  idle: "#22c55e",
  thinking: "#3b82f6",
  tool_calling: "#f97316",
  speaking: "#a855f7",
  spawning: "#06b6d4",
  error: "#ef4444",
  offline: "#6b7280",
};

export const STATUS_LABELS: Record<AgentVisualStatus, string> = {
  idle: "대기",
  thinking: "생각 중",
  tool_calling: "도구 실행",
  speaking: "답변 중",
  spawning: "생성 중",
  error: "오류",
  offline: "오프라인",
};

export function getZoneLabel(zone: keyof typeof ZONES): string {
  return i18n.t(`common:zones.${zone}`);
}

export function getStatusLabel(status: AgentVisualStatus): string {
  return i18n.t(`common:agent.statusLabels.${status}`);
}

export const DESK_GRID_COLS = 4;
export const DESK_GRID_ROWS = 3;
export const DESK_MAX_AGENTS = DESK_GRID_COLS * DESK_GRID_ROWS;

export const HOT_DESK_GRID_COLS = 4;
export const HOT_DESK_GRID_ROWS = 3;

export const MIN_DESK_WIDTH = 100;
export const DEFAULT_MAX_SUB_AGENTS = 8;

export const FURNITURE = {
  desk: { width: 100, height: 60 },
  chair: { size: 30 },
  meetingTable: { minRadius: 60, maxRadius: 100 },
  sofa: { width: 110, height: 50 },
  plant: { width: 28, height: 36 },
  coffeeCup: { size: 14 },
} as const;

export const DESK_UNIT = {
  width: 140,
  height: 110,
  avatarRadius: 20,
  avatarOffsetY: -8,
} as const;

export const AVATAR = {
  radius: 20,
  selectedRadius: 24,
  strokeWidth: 3,
  nameLabelMaxChars: 12,
} as const;

export const SCALE_X_2D_TO_3D = 16 / SVG_WIDTH;
export const SCALE_Z_2D_TO_3D = 12 / SVG_HEIGHT;
export const SCALE_2D_TO_3D = 0.01;
export const DESK_HEIGHT = 0.42;
export const CHARACTER_Y = 0;
export const MEETING_TABLE_RADIUS = 1.2;
export const MEETING_SEAT_RADIUS = 1.7;
