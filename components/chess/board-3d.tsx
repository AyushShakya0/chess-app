"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Chess, Square } from "chess.js";
import { RotateCw, Eye, Camera, RefreshCw } from "lucide-react";

interface Board3DProps {
  game: Chess;
}

export const Board3D: React.FC<Board3DProps> = ({ game }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Viewpoint presets
  const setCameraView = (type: "white" | "black" | "overhead") => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (type === "white") {
      cam.position.set(0, 11, 13);
      ctrl.target.set(0, 0, 0);
    } else if (type === "black") {
      cam.position.set(0, 11, -13);
      ctrl.target.set(0, 0, 0);
    } else if (type === "overhead") {
      cam.position.set(0, 17, 0.01);
      ctrl.target.set(0, 0, 0);
    }
    ctrl.update();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120); // Deep midnight slate

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 11, 13);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    // 2. Smooth Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera going below board
    controls.minDistance = 6;
    controls.maxDistance = 24;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controlsRef.current = controls;

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    scene.add(ambientLight);

    // Main key light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(7, 16, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Subtle blue rim / fill light
    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.6);
    fillLight.position.set(-8, 10, -8);
    scene.add(fillLight);

    // 4. Board Hierarchy
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Mahogany Outer Beveled Frame
    const frameGeo = new THREE.BoxGeometry(9.6, 0.6, 9.6);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x22130c,
      roughness: 0.35,
      metalness: 0.1,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.y = -0.3;
    frameMesh.receiveShadow = true;
    boardGroup.add(frameMesh);

    // Inner Gold Trim Inlay
    const trimGeo = new THREE.BoxGeometry(8.9, 0.02, 8.9);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.8,
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.y = 0.01;
    boardGroup.add(trimMesh);

    // Individual Tiles (8x8)
    const tileGeo = new THREE.BoxGeometry(1.05, 0.15, 1.05);
    const lightTileMat = new THREE.MeshStandardMaterial({
      color: 0xf5ecd7, // Alabaster maple
      roughness: 0.28,
      metalness: 0.05,
    });
    const darkTileMat = new THREE.MeshStandardMaterial({
      color: 0x6e3c1b, // Rich dark walnut
      roughness: 0.3,
      metalness: 0.05,
    });

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const tile = new THREE.Mesh(tileGeo, isLight ? lightTileMat : darkTileMat);
        tile.position.set(c * 1.05 - 3.675, 0.08, r * 1.05 - 3.675);
        tile.receiveShadow = true;
        boardGroup.add(tile);
      }
    }

    // 5. Materials for Staunton Pieces
    const ivoryPieceMat = new THREE.MeshStandardMaterial({
      color: 0xf8f5ee,
      roughness: 0.2,
      metalness: 0.1,
    });
    const ebonyPieceMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.25,
      metalness: 0.2,
    });

    // 6. Sculpted Staunton Piece Builders
    const buildPawn = (mat: THREE.Material): THREE.Group => {
      const group = new THREE.Group();
      // Turned body
      const pts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.36, 0),
        new THREE.Vector2(0.36, 0.08),
        new THREE.Vector2(0.30, 0.14),
        new THREE.Vector2(0.26, 0.2),
        new THREE.Vector2(0.16, 0.45),
        new THREE.Vector2(0.14, 0.55),
        new THREE.Vector2(0.20, 0.58),
        new THREE.Vector2(0.18, 0.62),
        new THREE.Vector2(0, 0.62),
      ];
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Spherical head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 16), mat);
      head.position.y = 0.74;
      head.castShadow = true;
      group.add(head);
      return group;
    };

    const buildRook = (mat: THREE.Material): THREE.Group => {
      const group = new THREE.Group();
      const pts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.38, 0),
        new THREE.Vector2(0.38, 0.1),
        new THREE.Vector2(0.32, 0.16),
        new THREE.Vector2(0.25, 0.26),
        new THREE.Vector2(0.24, 0.75),
        new THREE.Vector2(0.32, 0.82),
        new THREE.Vector2(0.34, 1.05),
        new THREE.Vector2(0.26, 1.05),
        new THREE.Vector2(0.26, 0.94),
        new THREE.Vector2(0, 0.94),
      ];
      const tower = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat);
      tower.castShadow = true;
      tower.receiveShadow = true;
      group.add(tower);

      // Crenellated Battlements
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const bGeo = new THREE.BoxGeometry(0.12, 0.16, 0.12);
        const battlement = new THREE.Mesh(bGeo, mat);
        battlement.position.set(Math.cos(angle) * 0.28, 1.08, Math.sin(angle) * 0.28);
        battlement.castShadow = true;
        group.add(battlement);
      }
      return group;
    };

    const buildKnight = (mat: THREE.Material, color: "w" | "b"): THREE.Group => {
      const group = new THREE.Group();
      // Pedestal base
      const pts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.38, 0),
        new THREE.Vector2(0.38, 0.1),
        new THREE.Vector2(0.32, 0.18),
        new THREE.Vector2(0.26, 0.28),
        new THREE.Vector2(0.24, 0.36),
        new THREE.Vector2(0, 0.36),
      ];
      const base = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat);
      base.castShadow = true;
      group.add(base);

      // Sculpted horse neck & mane
      const neckGeo = new THREE.CylinderGeometry(0.16, 0.25, 0.6, 12);
      neckGeo.rotateZ(0.25);
      const neck = new THREE.Mesh(neckGeo, mat);
      neck.position.set(-0.06, 0.62, 0);
      neck.castShadow = true;
      group.add(neck);

      // Muzzle / Snout
      const snoutGeo = new THREE.ConeGeometry(0.18, 0.45, 12);
      snoutGeo.rotateZ(-1.2);
      const snout = new THREE.Mesh(snoutGeo, mat);
      snout.position.set(0.12, 0.78, 0);
      snout.castShadow = true;
      group.add(snout);

      // Ears
      const ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), mat);
      ear1.position.set(-0.06, 0.98, 0.08);
      ear1.rotateZ(-0.2);
      group.add(ear1);

      const ear2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), mat);
      ear2.position.set(-0.06, 0.98, -0.08);
      ear2.rotateZ(-0.2);
      group.add(ear2);

      // Rotate knight to face the opponent
      group.rotation.y = color === "w" ? 0 : Math.PI;
      return group;
    };

    const buildBishop = (mat: THREE.Material): THREE.Group => {
      const group = new THREE.Group();
      const pts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.38, 0),
        new THREE.Vector2(0.38, 0.1),
        new THREE.Vector2(0.32, 0.16),
        new THREE.Vector2(0.24, 0.3),
        new THREE.Vector2(0.18, 0.75),
        new THREE.Vector2(0.26, 0.84),
        new THREE.Vector2(0.24, 0.92),
        new THREE.Vector2(0, 0.92),
      ];
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat);
      body.castShadow = true;
      group.add(body);

      // Miter Head (Egg/Sphere)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), mat);
      head.scale.set(0.9, 1.3, 0.9);
      head.position.y = 1.05;
      head.castShadow = true;
      group.add(head);

      // Top Ball Finial
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat);
      finial.position.y = 1.36;
      finial.castShadow = true;
      group.add(finial);

      return group;
    };

    const buildQueen = (mat: THREE.Material): THREE.Group => {
      const group = new THREE.Group();
      const pts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.42, 0),
        new THREE.Vector2(0.42, 0.1),
        new THREE.Vector2(0.34, 0.18),
        new THREE.Vector2(0.26, 0.32),
        new THREE.Vector2(0.2, 0.95),
        new THREE.Vector2(0.28, 1.05),
        new THREE.Vector2(0.34, 1.25),
        new THREE.Vector2(0.24, 1.25),
        new THREE.Vector2(0, 1.15),
      ];
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat);
      body.castShadow = true;
      group.add(body);

      // Coronet Points
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8;
        const pt = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), mat);
        pt.position.set(Math.cos(ang) * 0.32, 1.3, Math.sin(ang) * 0.32);
        pt.castShadow = true;
        group.add(pt);
      }

      // Center Crown Pearl
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), mat);
      pearl.position.y = 1.38;
      pearl.castShadow = true;
      group.add(pearl);

      return group;
    };

    const buildKing = (mat: THREE.Material): THREE.Group => {
      const group = new THREE.Group();
      const pts = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.44, 0),
        new THREE.Vector2(0.44, 0.12),
        new THREE.Vector2(0.36, 0.2),
        new THREE.Vector2(0.28, 0.35),
        new THREE.Vector2(0.22, 1.1),
        new THREE.Vector2(0.32, 1.2),
        new THREE.Vector2(0.34, 1.35),
        new THREE.Vector2(0.26, 1.35),
        new THREE.Vector2(0, 1.25),
      ];
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat);
      body.castShadow = true;
      group.add(body);

      // Cross finial on top of King
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), mat);
      vBar.position.y = 1.5;
      vBar.castShadow = true;
      group.add(vBar);

      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.08), mat);
      hBar.position.y = 1.54;
      hBar.castShadow = true;
      group.add(hBar);

      return group;
    };

    // 7. Place Sculpted Pieces onto Board from current Game state
    const boardState = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (!piece) continue;

        const mat = piece.color === "w" ? ivoryPieceMat : ebonyPieceMat;
        let pieceObj: THREE.Group;

        switch (piece.type) {
          case "p":
            pieceObj = buildPawn(mat);
            break;
          case "r":
            pieceObj = buildRook(mat);
            break;
          case "n":
            pieceObj = buildKnight(mat, piece.color);
            break;
          case "b":
            pieceObj = buildBishop(mat);
            break;
          case "q":
            pieceObj = buildQueen(mat);
            break;
          case "k":
            pieceObj = buildKing(mat);
            break;
          default:
            pieceObj = buildPawn(mat);
        }

        pieceObj.position.set(c * 1.05 - 3.675, 0.15, r * 1.05 - 3.675);
        boardGroup.add(pieceObj);
      }
    }

    // 8. Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [game, autoRotate]);

  return (
    <div className="relative flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* 3D View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[640px] mb-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl shadow-lg gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-300">Camera View:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCameraView("white")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            White
          </button>
          <button
            onClick={() => setCameraView("black")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Black
          </button>
          <button
            onClick={() => setCameraView("overhead")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Overhead
          </button>
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            autoRotate
              ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-400"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
          Auto-Rotate: {autoRotate ? "ON" : "OFF"}
        </button>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px] lg:w-[640px] lg:h-[640px] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-950 cursor-grab active:cursor-grabbing"
      />

      <span className="text-[11px] text-slate-400 mt-2.5 font-mono flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 text-blue-400" />
        Click and drag to orbit &bull; Scroll to zoom &bull; Right-click to pan
      </span>
    </div>
  );
};
