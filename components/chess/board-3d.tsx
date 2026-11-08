"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Chess } from "chess.js";

interface Board3DProps {
  game: Chess;
}

export const Board3D: React.FC<Board3DProps> = ({ game }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 580;
    const height = containerRef.current.clientHeight || 580;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(8, 18, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. Chessboard Frame & Squares
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Base Frame
    const frameGeo = new THREE.BoxGeometry(9.2, 0.6, 9.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314, // Dark Mahogany Wood
      roughness: 0.35,
      metalness: 0.1,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = -0.3;
    frame.receiveShadow = true;
    boardGroup.add(frame);

    // Individual Tiles (8x8)
    const squareGeo = new THREE.BoxGeometry(1, 0.2, 1);
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xe8d0ab, // Cream maple
      roughness: 0.4,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x8a5229, // Walnut
      roughness: 0.4,
    });

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const tile = new THREE.Mesh(squareGeo, isLight ? lightMat : darkMat);
        tile.position.set(c - 3.5, 0, r - 3.5);
        tile.receiveShadow = true;
        boardGroup.add(tile);
      }
    }

    // 4. Render 3D Pieces from current game state
    const boardState = game.board();
    const whitePieceMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f4,
      roughness: 0.25,
      metalness: 0.2,
    });
    const blackPieceMat = new THREE.MeshStandardMaterial({
      color: 0x222225,
      roughness: 0.3,
      metalness: 0.4,
    });

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (!piece) continue;

        const mat = piece.color === "w" ? whitePieceMat : blackPieceMat;
        let pieceMesh: THREE.Mesh;

        if (piece.type === "p") {
          // Pawn: Cylinder base + Sphere head
          const geo = new THREE.CylinderGeometry(0.22, 0.34, 0.7, 16);
          pieceMesh = new THREE.Mesh(geo, mat);
          pieceMesh.position.set(c - 3.5, 0.45, r - 3.5);
        } else if (piece.type === "r") {
          // Rook: Castle tower
          const geo = new THREE.CylinderGeometry(0.32, 0.38, 1.0, 16);
          pieceMesh = new THREE.Mesh(geo, mat);
          pieceMesh.position.set(c - 3.5, 0.6, r - 3.5);
        } else if (piece.type === "n") {
          // Knight: Angled cone
          const geo = new THREE.ConeGeometry(0.36, 1.1, 16);
          pieceMesh = new THREE.Mesh(geo, mat);
          pieceMesh.position.set(c - 3.5, 0.65, r - 3.5);
        } else if (piece.type === "b") {
          // Bishop: Rounded top cylinder
          const geo = new THREE.CylinderGeometry(0.24, 0.36, 1.25, 16);
          pieceMesh = new THREE.Mesh(geo, mat);
          pieceMesh.position.set(c - 3.5, 0.72, r - 3.5);
        } else if (piece.type === "q") {
          // Queen: Tall crown cylinder
          const geo = new THREE.CylinderGeometry(0.32, 0.4, 1.45, 16);
          pieceMesh = new THREE.Mesh(geo, mat);
          pieceMesh.position.set(c - 3.5, 0.82, r - 3.5);
        } else {
          // King: Tallest with cross top
          const geo = new THREE.CylinderGeometry(0.35, 0.42, 1.6, 16);
          pieceMesh = new THREE.Mesh(geo, mat);
          pieceMesh.position.set(c - 3.5, 0.9, r - 3.5);
        }

        pieceMesh.castShadow = true;
        pieceMesh.receiveShadow = true;
        boardGroup.add(pieceMesh);
      }
    }

    // 5. Interactive Mouse Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      boardGroup.rotation.y += deltaX * 0.008;
      boardGroup.rotation.x = Math.max(-0.4, Math.min(0.6, boardGroup.rotation.x + deltaY * 0.005));

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // 6. Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      renderer.dispose();
    };
  }, [game]);

  return (
    <div className="relative flex flex-col items-center">
      <div
        ref={containerRef}
        className="w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] lg:w-[600px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 cursor-grab active:cursor-grabbing"
      />
      <span className="text-[11px] text-slate-400 mt-2 font-mono">
        💡 Click & drag anywhere on the 3D board to rotate perspective
      </span>
    </div>
  );
};

