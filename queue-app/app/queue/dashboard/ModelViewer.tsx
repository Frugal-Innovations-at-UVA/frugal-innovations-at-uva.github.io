"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ModelViewerProps {
  fileUrl: string;
  fileName: string;
}

// Renders the original design file's geometry (STL or 3MF) with basic
// orbit/zoom controls. Loaded only when the "3D Model" tab is opened (see
// FilePreviewTabs' next/dynamic import) so three.js never ships on pages
// that don't need it.
export default function ModelViewer({ fileUrl, fileName }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animationFrame = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f3f1);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    camera.position.set(80, 80, 80);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const directional = new THREE.DirectionalLight(0xffffff, 0.9);
    directional.position.set(1, 1, 1);
    scene.add(directional);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    container.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    function resize() {
      // Re-read from the ref rather than closing over the outer `container`
      // — TypeScript doesn't carry the earlier null-check's narrowing into
      // this nested function declaration.
      const node = containerRef.current;
      if (!node) return;
      const { clientWidth, clientHeight } = node;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    }

    function frameObject(object: THREE.Object3D) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const distance = maxDim * 2;
      camera.position.set(distance, distance, distance);
      camera.near = maxDim / 100;
      camera.far = maxDim * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
    }

    async function load() {
      try {
        const extension = fileName.toLowerCase().split(".").pop();

        if (extension === "stl") {
          const geometry = await new STLLoader().loadAsync(fileUrl);
          geometry.computeVertexNormals();
          const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ color: 0x2f7f4f })
          );
          if (disposed) return;
          scene.add(mesh);
          frameObject(mesh);
        } else if (extension === "3mf") {
          const object = await new ThreeMFLoader().loadAsync(fileUrl);
          if (disposed) return;
          scene.add(object);
          frameObject(object);
        } else {
          setError("Unsupported file type for 3D preview.");
        }
      } catch {
        if (!disposed) setError("Could not load the 3D model.");
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    load();
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function animate() {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const material = obj.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [fileUrl, fileName]);

  return (
    <div className="queue-model-viewer">
      {loading && !error && <div className="queue-model-viewer__status">Loading model…</div>}
      {error && <div className="queue-model-viewer__status">{error}</div>}
      <div ref={containerRef} className="queue-model-viewer__canvas" />
    </div>
  );
}
