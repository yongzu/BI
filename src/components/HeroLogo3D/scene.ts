import {
  CubicBezierCurve3,
  CurvePath,
  DirectionalLight,
  Euler,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Quaternion,
  Scene,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import anim from './logoAnim.json';

/**
 * 히어로 3D 로고 장면 — phi.design 히어로의 Φ 로고를 그대로 옮김(사용자 지시 2026-10-05, 원본 데이터 사용 허락).
 *
 * 고리 두 개(big · small)가 전부다. 각 고리는 베지어 4점짜리 닫힌 곡선을 관(Tube)으로 감싼 것이고,
 * 블렌더에서 구운 프레임(30fps × 151)마다 회전 · 크기 · 위치 · 굵기를 보간해 돌린다(logoAnim.json = phi.design 원본).
 * 재생 곡선 · 재질 · 조명 · 정사영 카메라 · 마우스 기울기 값도 phi.design과 같다.
 */

type Key = { co: number[]; hl: number[]; hr: number[] };
type Ring = { spline: Key[]; seam_op: number[] | null; quat: number[][]; bevel: number[]; scale: number[][]; center: number[][] };

const FRAMES = anim.rings.big.quat.length - 1; // 150
const CLIP_MS = (FRAMES / anim.fps) * 1000; // 5000 — 구운 애니메이션 길이
const HALF = anim.ortho_scale / 2;
// 재생 곡선(phi.design 그대로): 0.6초 동안 천천히 출발 → 등속 → 마지막 0.65초에 감속해 138프레임 이후를 끝까지
const EASE_IN_MS = 600;
const EASE_IN_CLIP = 240;
const EASE_OUT_MS = 650;
const OUT_FROM = (138 / FRAMES) * CLIP_MS; // 4600
const OUT_LEN = CLIP_MS - OUT_FROM; // 400
/** 한 바퀴 길이(5.61초) */
export const CYCLE_MS = CLIP_MS + 360 + (EASE_OUT_MS - OUT_LEN);

/** 한 바퀴 안의 시간(ms) → 애니메이션 진행(0 → 1) */
export function phaseAt(ms: number) {
  if (ms < EASE_IN_MS) {
    const t = ms / EASE_IN_MS;
    return (EASE_IN_CLIP * (3 - 2 * t) * t * t + EASE_IN_MS * (t - 1) * t * t) / CLIP_MS;
  }
  const linearEnd = EASE_IN_MS + (OUT_FROM - EASE_IN_CLIP);
  if (ms < linearEnd) return (EASE_IN_CLIP + (ms - EASE_IN_MS)) / CLIP_MS;
  if (ms < linearEnd + EASE_OUT_MS) {
    const i = (ms - linearEnd) / EASE_OUT_MS;
    return (OUT_FROM + (EASE_OUT_MS * i * (i - 1) * (i - 1) + OUT_LEN * (3 - 2 * i) * i * i)) / CLIP_MS;
  }
  return 1;
}

const v3 = (a: number[]) => new Vector3(a[0], a[1], a[2]);

function ringPath(spline: Key[]) {
  const path = new CurvePath<Vector3>();
  spline.forEach((k, i) => {
    const next = spline[(i + 1) % spline.length];
    path.add(new CubicBezierCurve3(v3(k.co), v3(k.hr), v3(next.hl), v3(next.co)));
  });
  return path;
}

/** 관 굵기는 가장 가는 값으로 만들고, 가장 굵은 값을 모프 타깃으로 얹어 프레임마다 섞는다 */
function ringGeometry(ring: Ring) {
  const min = Math.min(...ring.bevel);
  const max = Math.max(...ring.bevel);
  const path = ringPath(ring.spline);
  const geo = new TubeGeometry(path, 256, min, 24, true);
  if (max - min > 1e-6) geo.morphAttributes.position = [new TubeGeometry(path, 256, max, 24, true).getAttribute('position')];
  return { geo, min, max };
}

function ringTrack(ring: Ring) {
  const seam = ring.seam_op;
  return {
    quats: ring.quat.map((q) => new Quaternion(q[0], q[1], q[2], q[3])),
    scales: ring.scale.map(v3),
    centers: ring.center.map(v3),
    bevels: ring.bevel,
    // 한 바퀴 걸러 큰 고리에 곱하는 회전 — 끝 장면과 첫 장면을 이음매 없이 잇는다
    seam: seam ? new Quaternion(seam[0], seam[1], seam[2], seam[3]) : null,
  };
}

export type LogoScene = {
  /** 바퀴 안의 시간(ms)과 몇 번째 바퀴인지로 한 장면을 그린다 */
  render: (cycleMs: number, cycle: number) => void;
  /** 마우스 기울기를 목표 쪽으로 한 걸음 */
  step: () => void;
  dispose: () => void;
};

export function createLogoScene(host: HTMLElement): LogoScene {
  const scene = new Scene();
  const camera = new OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.01, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  const material = new MeshStandardMaterial({ color: 0x101010, roughness: 0.42, metalness: 0.15 });
  const big = ringGeometry(anim.rings.big);
  const small = ringGeometry(anim.rings.small);
  const bigMesh = new Mesh(big.geo, material);
  const smallMesh = new Mesh(small.geo, material);
  const group = new Group();
  group.add(bigMesh, smallMesh);
  scene.add(group);
  scene.add(new HemisphereLight(0xffffff, 0x666666, 2.4));
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(-2, 4, 5);
  scene.add(sun);

  const bigTrack = ringTrack(anim.rings.big);
  const smallTrack = ringTrack(anim.rings.small);

  // 마우스 기울기: 로고 위에서 포인터 위치에 따라 최대 0.28rad, 프레임마다 6%씩 따라간다
  const target = new Quaternion();
  const tilt = new Quaternion();
  const euler = new Euler();
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    euler.set(0.28 * y, 0.28 * x, 0, 'XYZ');
    target.setFromEuler(euler);
  };
  const onLeave = () => target.identity();
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);

  const resize = () => {
    const size = Math.max(1, Math.min(host.clientWidth, host.clientHeight));
    renderer.setSize(size, size, false);
    renderer.domElement.style.width = `${size}px`;
    renderer.domElement.style.height = `${size}px`;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const pose = (
    mesh: Mesh,
    track: ReturnType<typeof ringTrack>,
    geo: { min: number; max: number },
    a: number,
    b: number,
    f: number,
    seam: boolean,
  ) => {
    mesh.quaternion.slerpQuaternions(track.quats[a], track.quats[b], f);
    if (track.seam && seam) mesh.quaternion.multiply(track.seam);
    mesh.scale.lerpVectors(track.scales[a], track.scales[b], f);
    mesh.position.lerpVectors(track.centers[a], track.centers[b], f);
    const bevel = track.bevels[a] + (track.bevels[b] - track.bevels[a]) * f;
    if (mesh.morphTargetInfluences && geo.max > geo.min) mesh.morphTargetInfluences[0] = (bevel - geo.min) / (geo.max - geo.min);
  };

  return {
    render(cycleMs, cycle) {
      const t = Math.min(Math.max(phaseAt(cycleMs), 0), 1) * FRAMES;
      const a = Math.min(Math.floor(t), FRAMES - 1);
      const seam = cycle % 2 === 1;
      pose(bigMesh, bigTrack, big, a, a + 1, t - a, seam);
      pose(smallMesh, smallTrack, small, a, a + 1, t - a, seam);
      group.quaternion.copy(tilt);
      renderer.render(scene, camera);
    },
    step() {
      tilt.slerp(target, 0.06);
    },
    dispose() {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      renderer.domElement.remove();
      big.geo.dispose();
      small.geo.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
