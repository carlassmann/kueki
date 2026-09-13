export type Role = 'baby' | 'parent';
export type Session = {
  roomId: string;
  roomName: string;
  deviceId: string;
  token: string;
  name: string;
  role: Role;
  roomKey: string;
};
export type PublicDevice = {
  id: string;
  name: string;
  role: Role;
  online: boolean;
  monitoring: boolean;
  level: number;
  lastNoise: number;
  sensitivity: number;
  mutedBy: string[];
  lastSeen: number;
};
export type Alert = {
  id: string;
  deviceId: string;
  name: string;
  kind: 'noise' | 'offline' | 'paused';
  at: number;
};
export type RoomSettings = {
  alertAfterMs: number;
  cooldownMs: number;
  offlineAlertMs: number;
  retentionMs: number;
};
export type ServerMessage =
  | {
      type: 'state';
      roomKey?: string;
      roomName?: string;
      settings: RoomSettings;
      devices: PublicDevice[];
      events: Alert[];
      at: number;
    }
  | { type: 'signal'; source: string; payload: Signal }
  | { type: 'error'; message: string }
  | { type: 'ready' };
export type Signal = {
  callId: string;
  kind: 'offer' | 'answer' | 'ice' | 'stop';
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};
export const HEARTBEAT_MS = 3000;
export const OFFLINE_MS = 12000;
export const OFFLINE_ALERT_MS = 60000;

export const ROOM_SETTING_CHOICES = {
  alertAfterMs: [0, 2_000, 5_000, 10_000],
  cooldownMs: [10_000, 20_000, 60_000, 300_000],
  offlineAlertMs: [30_000, 60_000, 300_000, 600_000],
  retentionMs: [21_600_000, 86_400_000, 259_200_000],
} as const satisfies Record<keyof RoomSettings, readonly number[]>;

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  alertAfterMs: 0,
  cooldownMs: 20_000,
  offlineAlertMs: OFFLINE_ALERT_MS,
  retentionMs: 86_400_000,
};

export function roomSettings(stored: unknown): RoomSettings {
  const settings = { ...DEFAULT_ROOM_SETTINGS };
  if (typeof stored !== 'object' || stored === null) return settings;
  const source: Record<string, unknown> = { ...stored };
  for (const key of settingKeys) {
    const value = source[key];
    const choices: readonly number[] = ROOM_SETTING_CHOICES[key];
    if (typeof value === 'number' && choices.includes(value)) settings[key] = value;
  }
  return settings;
}

const settingKeys = Object.keys(DEFAULT_ROOM_SETTINGS) as (keyof RoomSettings)[];
