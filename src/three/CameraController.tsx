import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCameraStore } from '../store/cameraStore';
import { useUIStore } from '../store/uiStore';
import { useWebSocket } from '../hooks/useWebSocket';

/** WASD + 拖拽 + 滚轮 + 触控 飞行控制 */
export default function CameraController() {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const yaw = useRef(0);
  const pitch = useRef(0);
  // 触控状态
  const touchStart = useRef<{ x: number; y: number; dist: number } | null>(null);

  const setCamera = useCameraStore((s) => s.setPosition);
  const setCamDir = useCameraStore((s) => s.setDirection);
  const speed = useCameraStore((s) => s.speed);

  // T-007: 落地页视差进度
  const landingProgress = useUIStore((s) => s.landingProgress);
  const isLandingDone = useUIStore((s) => s.isLandingDone);
  // T-013: Onboarding 自动飞行
  const isOnboarding = useUIStore((s) => s.isOnboarding);
  const autoFlyElapsed = useRef(0);
  const autoFlyDone = useRef(false);

  // T-021: WebSocket 位置广播
  const { updatePosition: broadcastPosition } = useWebSocket();
  const lastBroadcast = useRef(0);

  const BASE_Z = 150;
  const MAX_Z = 250;

  // 初始位置
  useEffect(() => {
    camera.position.set(0, 0, BASE_Z);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // 键盘监听
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());

    // 鼠标拖拽
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      yaw.current -= dx * 0.002;
      pitch.current -= dy * 0.002;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2.2, Math.PI / 2.2);
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging.current = false; };

    // 滚轮调速
    const onWheel = (e: WheelEvent) => {
      const currentSpeed = useCameraStore.getState().speed;
      const newSpeed = THREE.MathUtils.clamp(
        currentSpeed * (e.deltaY < 0 ? 1.2 : 0.8),
        1,
        300,
      );
      useCameraStore.getState().setSpeed(newSpeed);
    };

    // T-010: 移动端触控
    const getTouchDist = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        touchStart.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          dist: getTouchDist(e.touches),
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging.current) {
        const dx = e.touches[0].clientX - prevMouse.current.x;
        const dy = e.touches[0].clientY - prevMouse.current.y;
        yaw.current -= dx * 0.003;
        pitch.current -= dy * 0.003;
        pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2.2, Math.PI / 2.2);
        prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && touchStart.current) {
        const newDist = getTouchDist(e.touches);
        const scale = newDist / touchStart.current.dist;
        const currentSpeed = useCameraStore.getState().speed;
        const newSpeed = THREE.MathUtils.clamp(currentSpeed * scale, 1, 300);
        useCameraStore.getState().setSpeed(newSpeed);
        touchStart.current.dist = newDist;
      }
    };

    const onTouchEnd = () => {
      isDragging.current = false;
      touchStart.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    gl.domElement.addEventListener('pointerdown', onMouseDown);
    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', onMouseUp);
    gl.domElement.addEventListener('wheel', onWheel, { passive: true });
    gl.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    gl.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    gl.domElement.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      gl.domElement.removeEventListener('pointerdown', onMouseDown);
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
      gl.domElement.removeEventListener('wheel', onWheel);
      gl.domElement.removeEventListener('touchstart', onTouchStart);
      gl.domElement.removeEventListener('touchmove', onTouchMove);
      gl.domElement.removeEventListener('touchend', onTouchEnd);
    };
  }, [gl]);

  // 逐帧飞行
  useFrame((_, dt) => {
    // T-013: Onboarding 自动飞行（螺旋前进 3.5s）
    if (isOnboarding && !autoFlyDone.current) {
      autoFlyElapsed.current += dt || 0.016;
      const t = Math.min(autoFlyElapsed.current / 3.5, 1);

      // 螺旋路径：从远处向内盘旋
      const radius = 180 * (1 - t * 0.6);
      const angle = t * Math.PI * 1.8;
      const z = MAX_Z * (1 - t * 0.55);

      camera.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 0.6) * 40,
        z,
      );
      camera.lookAt(0, 0, 0);

      if (t >= 1) {
        autoFlyDone.current = true;
        // 飞行结束，停在视角起始位
        camera.position.set(0, 0, BASE_Z);
        camera.lookAt(0, 0, 0);
      }

      setCamera([camera.position.x, camera.position.y, camera.position.z]);
      return; // 自动飞行期间跳过手动控制
    }

    // 重置自动飞行状态
    if (!isOnboarding) {
      autoFlyElapsed.current = 0;
      autoFlyDone.current = false;
    }

    const k = keys.current;
    let forward = 0;
    let strafe = 0;

    if (k.has('w') || k.has('arrowup')) forward += 1;
    if (k.has('s') || k.has('arrowdown')) forward -= 1;
    if (k.has('a') || k.has('arrowleft')) strafe -= 1;
    if (k.has('d') || k.has('arrowright')) strafe += 1;

    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);

    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);

    const spd = speed * (dt || 0.016);
    if (forward !== 0) camera.position.addScaledVector(dir, forward * spd);
    if (strafe !== 0) camera.position.addScaledVector(right, strafe * spd);

    // T-007: 落地页视差 — 滚动驱动相机后拉
    if (!isLandingDone) {
      const targetZ = BASE_Z + landingProgress * (MAX_Z - BASE_Z);
      camera.position.z += (targetZ - camera.position.z) * 0.08;
    }

    // 转向
    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));

    setCamera([camera.position.x, camera.position.y, camera.position.z]);
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    setCamDir([lookDir.x, lookDir.y, lookDir.z]);

    // T-021: 每秒广播一次位置
    const now = performance.now();
    if (now - lastBroadcast.current > 1000) {
      broadcastPosition({
        x: Math.round(camera.position.x),
        y: Math.round(camera.position.y),
        z: Math.round(camera.position.z),
      });
      lastBroadcast.current = now;
    }
  });

  return null;
}
