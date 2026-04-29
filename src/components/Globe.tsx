import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
export function Globe() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mountRef.current) return;
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    // Create the main wireframe globe
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    // Create atmospheric glow
    const glowGeometry = new THREE.SphereGeometry(5.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);
    // Add data center "nodes" (particles)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Generate points on sphere surface
      const phi = Math.acos(-1 + 2 * i / (particlesCount * 3));
      const theta = Math.sqrt(particlesCount * 3 * Math.PI) * phi;
      const r = 5.05; // Slightly above surface
      posArray[i] = r * Math.cos(theta) * Math.sin(phi);
      posArray[i + 1] = r * Math.sin(theta) * Math.sin(phi);
      posArray[i + 2] = r * Math.cos(phi);
    }
    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(posArray, 3)
    );
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x34d399,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    camera.position.z = 15;
    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      globe.rotation.x += 0.001;
      glow.rotation.y += 0.002;
      glow.rotation.x += 0.001;
      particlesMesh.rotation.y += 0.002;
      particlesMesh.rotation.x += 0.001;
      // Pulse particles
      const time = Date.now() * 0.003;
      particlesMaterial.opacity = 0.5 + Math.sin(time) * 0.3;
      renderer.render(scene, camera);
    };
    animate();
    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect =
      mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    window.addEventListener('resize', handleResize);
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);
  return (
    <div ref={mountRef} className="w-full h-full min-h-[400px] cursor-move" />);

}