import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Hero3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || 300) / (container.clientHeight || 400),
      0.1,
      1000
    );
    camera.position.set(0, 0.4, 6.8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth || 300, container.clientHeight || 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Main Group (Tilted in 3D Perspective)
    const mainGroup = new THREE.Group();
    mainGroup.rotation.y = THREE.MathUtils.degToRad(-14);
    mainGroup.rotation.x = THREE.MathUtils.degToRad(8);
    scene.add(mainGroup);

    // ─── 1. REALISTIC 3D METALLIC LAPTOP DEVICE ───

    // Laptop Base (Bottom Body)
    const baseGeo = new THREE.BoxGeometry(3.6, 0.15, 2.4);
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x141624,
      metalness: 0.85,
      roughness: 0.2,
    });
    const laptopBase = new THREE.Mesh(baseGeo, darkMetalMat);
    laptopBase.position.set(0, -0.9, 0);
    mainGroup.add(laptopBase);

    // Keyboard Area Accent
    const kbGeo = new THREE.PlaneGeometry(3.2, 1.8);
    const kbMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c16,
      roughness: 0.8,
    });
    const kbMesh = new THREE.Mesh(kbGeo, kbMat);
    kbMesh.rotation.x = -Math.PI / 2;
    kbMesh.position.set(0, -0.82, 0.1);
    mainGroup.add(kbMesh);

    // Laptop Screen Display (Opened Lid)
    const screenLidGroup = new THREE.Group();
    screenLidGroup.position.set(0, -0.83, -1.15);
    screenLidGroup.rotation.x = THREE.MathUtils.degToRad(-12);
    mainGroup.add(screenLidGroup);

    // Screen Lid Back Shell
    const lidShellGeo = new THREE.BoxGeometry(3.6, 2.4, 0.1);
    const lidShell = new THREE.Mesh(lidShellGeo, darkMetalMat);
    lidShell.position.set(0, 1.2, 0);
    screenLidGroup.add(lidShell);

    // Glowing Display Glass Screen
    const screenGlassGeo = new THREE.PlaneGeometry(3.4, 2.2);
    const screenGlassMat = new THREE.MeshStandardMaterial({
      color: 0x070914,
      emissive: 0x1e1238,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const screenGlass = new THREE.Mesh(screenGlassGeo, screenGlassMat);
    screenGlass.position.set(0, 1.2, 0.055);
    screenLidGroup.add(screenGlass);

    // UI Wireframe Wire Frame Outline on Screen
    const uiFrameGeo = new THREE.PlaneGeometry(3.2, 2.0);
    const uiFrameMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const uiFrame = new THREE.Mesh(uiFrameGeo, uiFrameMat);
    uiFrame.position.set(0, 1.2, 0.06);
    screenLidGroup.add(uiFrame);

    // ─── 2. FLOATING GLOSS 3D AI CRYSTAL PRISM ───
    const crystalGeo = new THREE.OctahedronGeometry(0.85, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(1.5, 0.8, 0.8);
    mainGroup.add(crystal);

    // Outer Wireframe Crystal Cage
    const crystalCageGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const crystalCageMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const crystalCage = new THREE.Mesh(crystalCageGeo, crystalCageMat);
    crystalCage.position.set(1.5, 0.8, 0.8);
    mainGroup.add(crystalCage);

    // ─── 3. ORBITING GLOWING PARTICLES & RINGS ───
    const ringGeo = new THREE.TorusGeometry(2.2, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    ring.position.set(0, 0.3, 0);
    mainGroup.add(ring);

    // ─── 4. LIGHTING SETUP ───
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const purplePointLight = new THREE.PointLight(0x8b5cf6, 4.0, 8);
    purplePointLight.position.set(-2, 2, 2);
    scene.add(purplePointLight);

    const goldPointLight = new THREE.PointLight(0xf59e0b, 4.0, 8);
    goldPointLight.position.set(2, 1, 2);
    scene.add(goldPointLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 3.0, 8);
    cyanPointLight.position.set(0, -1, 3);
    scene.add(cyanPointLight);

    // ─── 5. MOUSE PARALLAX & ANIMATION LOOP ───
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX = (e.clientX / innerWidth) * 2 - 1;
      mouseY = (e.clientY / innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Floating bobbing effect
      mainGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;

      // Crystal rotation
      crystal.rotation.y = elapsedTime * 0.8;
      crystal.rotation.x = elapsedTime * 0.4;
      crystalCage.rotation.y = -elapsedTime * 0.5;

      // Orbiting ring rotation
      ring.rotation.z = elapsedTime * 0.3;

      // Mouse Parallax smooth rotation
      const targetRotY = THREE.MathUtils.degToRad(-14) + mouseX * 0.25;
      const targetRotX = THREE.MathUtils.degToRad(8) - mouseY * 0.2;

      mainGroup.rotation.y += (targetRotY - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetRotX - mainGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = (container.clientWidth || 300) / (container.clientHeight || 400);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth || 300, container.clientHeight || 400);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[380px] sm:min-h-[460px] flex items-center justify-center relative select-none"
    />
  );
};
