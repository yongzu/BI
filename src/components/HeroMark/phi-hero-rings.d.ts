import type * as THREE from 'three';

export declare const HERO_DATA: {
  fps: number;
  ortho_scale: number;
  rings: Record<'big' | 'small', {
    radius: number;
    spline: { co: number[]; hl: number[]; hr: number[] }[];
    seam_op: number[] | null;
    quat: number[][];
    bevel: number[];
    scale: number[][];
    center: number[][];
  }>;
};
export declare const HERO_TIMING: { fps: number; frames: number; clipMs: number; loopMs: number };
export declare function heroProgressAt(ms: number): { progress: number; loopIndex: number };

export type PhiHeroStyle = 'solid' | 'line';
export interface PhiHero {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  group: THREE.Group;
  rings: { big: THREE.Mesh; small: THREE.Mesh };
  renderAt(ms: number): void;
  renderProgress(progress: number, loopIndex?: number): void;
  setStyle(style: PhiHeroStyle): void;
  setSize(px: number): void;
  setTilt(x: number, y: number): void;
  dispose(): void;
}
export declare function createPhiHero(o?: {
  canvas?: HTMLCanvasElement;
  size?: number;
  style?: PhiHeroStyle;
  pixelRatio?: number;
  color?: THREE.ColorRepresentation;
  ink?: THREE.ColorRepresentation;
  paper?: THREE.ColorRepresentation;
}): PhiHero;
