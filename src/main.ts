// parameters
const maxParticleCount = 190; // maximum simultaneous particle count before cycling
const particleSpawnIntervalMS = 100; // spawn a new particle once every this many ms (if frames are skipped, positions will be interpolated for a smooth particle trail!)

import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  ContaminantDesign,
  ContaminantDesignShape,
  ShapeToTexture,
} from "./viskar";

async function main() {
  const vertexShader = await fetch("./shader.vert").then((res) => res.text());
  const fragmentShader = await fetch("./shader.frag").then((res) => res.text());

  let baseSize = 500;

  const settings: ContaminantDesign = {
    shape: ContaminantDesignShape.Circular,
    shapeRandSize: 0,
    shapeRandProportions: 0,
    color: new THREE.Color("#dddddd"),
    colorRandH: 0,
    colorRandS: 0,
    colorRandL: 0,
    effectScaleOut: 0.5,
    effectBeat: 0,
    effectSpread: 0,
    effectSpiral: 0,
  };

  // UI callbacks

  (globalThis as any).updateBaseSize = (target: HTMLInputElement) => {
    baseSize = parseFloat(target.value);
    particlesMaterial.uniforms["baseSize"].value = baseSize;
  };

  (globalThis as any).updateShape = (target: HTMLInputElement) => {
    settings.shape = target.value as ContaminantDesignShape;

    const newTexture = new THREE.TextureLoader().load(
      ShapeToTexture[settings.shape]
    );
    newTexture.magFilter = THREE.LinearFilter;
    const oldTexture = particlesMaterial.uniforms["tex"].value;
    particlesMaterial.uniforms["tex"].value = newTexture;
    oldTexture.dispose();
  };
  (globalThis as any).updateShapeRandSize = (target: HTMLInputElement) => {
    settings.shapeRandSize = parseFloat(target.value);
    particlesMaterial.uniforms["shapeRandSize"].value = settings.shapeRandSize;
  };
  (globalThis as any).updateShapeRandProportions = (
    target: HTMLInputElement
  ) => {
    settings.shapeRandProportions = parseFloat(target.value);
    particlesMaterial.uniforms["shapeRandProportions"].value =
      settings.shapeRandProportions;
  };

  (globalThis as any).updateColor = (target: HTMLInputElement) => {
    settings.color = new THREE.Color(target.value);
    particlesMaterial.uniforms["color"].value = settings.color;
  };
  (globalThis as any).updateColorRandH = (target: HTMLInputElement) => {
    settings.colorRandH = parseFloat(target.value);
    particlesMaterial.uniforms["colorRandH"].value = settings.colorRandH;
  };
  (globalThis as any).updateColorRandS = (target: HTMLInputElement) => {
    settings.colorRandS = parseFloat(target.value);
    particlesMaterial.uniforms["colorRandS"].value = settings.colorRandS;
  };
  (globalThis as any).updateColorRandL = (target: HTMLInputElement) => {
    settings.colorRandL = parseFloat(target.value);
    particlesMaterial.uniforms["colorRandL"].value = settings.colorRandL;
  };

  (globalThis as any).updateEffectScaleOut = (target: HTMLInputElement) => {
    settings.effectScaleOut = parseFloat(target.value);
    particlesMaterial.uniforms["effectScaleOut"].value =
      settings.effectScaleOut;
  };
  (globalThis as any).updateEffectBeat = (target: HTMLInputElement) => {
    settings.effectBeat = parseFloat(target.value);
    particlesMaterial.uniforms["effectBeat"].value = settings.effectBeat;
  };
  (globalThis as any).updateEffectSpread = (target: HTMLInputElement) => {
    settings.effectSpread = parseFloat(target.value);
    particlesMaterial.uniforms["effectSpread"].value = settings.effectSpread;
  };

  // get initial window size to dynamically update scene on resize
  const displaySizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // create threejs scene
  const container = document.getElementById("threejs-container")!;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    displaySizes.width / displaySizes.height,
    0.1,
    1000
  );
  camera.position.z = 5;
  const renderer = new THREE.WebGLRenderer();
  scene.background = new THREE.Color("#777");
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.8;
  controls.enablePan = false;

  // change camera and renderer size dynamically when window is resized
  function updateWindowResize() {
    // get sizes
    displaySizes.width = window.innerWidth;
    displaySizes.height = window.innerHeight;

    // apply
    camera.aspect = displaySizes.width / displaySizes.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(displaySizes.width, displaySizes.height);
  }
  window.addEventListener("resize", updateWindowResize);
  updateWindowResize();

  // create particles as buffer geometry
  const particlesGeometry = new THREE.BufferGeometry();

  // position attribute (placeholder)
  const positions = new Float32Array(maxParticleCount * 3);
  const sizes = new Float32Array(maxParticleCount);
  const startTimes = new Float32Array(maxParticleCount);

  // spawn-time attribute (placeholder)

  // pre calculate random sizes. this is more efficient than computing the random size each frame
  for (let i = 0; i < maxParticleCount; i++) {
    sizes[i] = Math.pow(Math.random(), 1.5) + 0.5; // initialized with random sizes for variation, ranging 0.5-2, with bias towards smaller for a nicer look
    startTimes[i] = -1; // -1 means unused particle, this will be overwritten each time this particle is cycled through
  }

  // apply attributes to particle geo
  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  particlesGeometry.setAttribute(
    "startTime",
    new THREE.BufferAttribute(startTimes, 1)
  );
  particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // create material
  const newTexture = new THREE.TextureLoader().load(
    ShapeToTexture[settings.shape]
  );
  newTexture.magFilter = THREE.NearestFilter;
  const particlesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      baseSize: { value: baseSize },
      tex: { value: newTexture },
      currentTime: { value: 0 }, // placeholder, will be overwritten each time this particle is cycled through
      shapeRandSize: { value: settings.shapeRandSize },
      shapeRandProportions: { value: settings.shapeRandProportions },
      color: { value: settings.color },
      colorRandH: { value: settings.colorRandH },
      colorRandS: { value: settings.colorRandS },
      colorRandL: { value: settings.colorRandL },
      effectScaleOut: { value: settings.effectScaleOut },
      effectBeat: { value: settings.effectBeat },
      effectSpread: { value: settings.effectSpread },
      effectSpiral: { value: settings.effectSpiral },
    },
    transparent: true,
    depthWrite: false,

    // vertex shader (animated motion and scale)
    vertexShader,

    // fragment shader (animates colors)
    fragmentShader,
  });

  // add points with this particle material to the scene
  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particleSystem);

  // place the next particle in the cycle at a position with specific startTime
  let crrParticleIndex = 0; // current particle index
  function addParticle(x: number, y: number, z: number, startTime: number) {
    // position
    positions[crrParticleIndex * 3] = x;
    positions[crrParticleIndex * 3 + 1] = y;
    positions[crrParticleIndex * 3 + 2] = z;
    particlesGeometry.attributes.position.needsUpdate = true;

    // start time initialize
    startTimes[crrParticleIndex] = startTime;
    particlesGeometry.attributes.startTime.needsUpdate = true;

    // cycle index (if exceeding maximum index, go back to 0 and reuse earlier first particle)
    crrParticleIndex++;
    if (crrParticleIndex >= maxParticleCount) {
      crrParticleIndex = 0;
    }
  }

  // interactions
  let lastMouseMoveEvent: MouseEvent | Touch;
  let prvPos: THREE.Vector3; // store previous spawn position
  function requestParticles(
    event: MouseEvent | Touch,
    resetParticleSpawnCounter = false
  ) {
    const currentTime = getElapsedTime();
    lastMouseMoveEvent = event; // register mouse moved (to keep spawning when mouse not moving)

    // check how many new particles should be spawned on this frame
    const maxParticleCount = particlesToSpawn(resetParticleSpawnCounter);
    if (maxParticleCount == 0) return;

    // get on-screen spawn position
    // const x = (event.clientX / displaySizes.width) * 2 - 1;
    // const y = -(event.clientY / displaySizes.height) * 2 + 1;

    const speed = 0.5;

    const x = Math.cos(currentTime * speed) / 2;
    const y =
      (Math.sin(currentTime * speed) * Math.cos(currentTime * speed)) / 2;
    const scale = 7;

    // place in world space
    // const vector = new THREE.Vector3(x, y, 0.5);
    // vector.unproject(camera);
    // const dir = vector.sub(camera.position).normalize();
    // const distance = -camera.position.z / dir.z;
    // const pos = camera.position.clone().add(dir.multiplyScalar(distance)); // world position
    const pos = new THREE.Vector3(x, y, 0).multiplyScalar(scale);

    // spawn particles
    for (let i = 0; i < maxParticleCount; i++) {
      const ratio = (i + 1) / maxParticleCount; // (0-1]
      let p = pos;
      if (prvPos) {
        // interpolate with previous frame's position for a continuous streak
        p = prvPos.clone().lerp(p, ratio); // overwrite with lerped
      }
      addParticle(p.x, p.y, p.z, currentTime + ratio * 0.001); // draw new particle, give it a slight 'currentTime' offset to make sure each particle is unique even when created on the same frame
    }

    // store as previous spawn position to interpolate on next frame
    prvPos = new THREE.Vector3(pos.x, pos.y, pos.z);
  }

  // get the current time
  const startTime = Date.now() / 1000; // current clock time in seconds
  function getElapsedTime() {
    // time since page load in seconds
    return Date.now() / 1000 - startTime;
  }

  // get the amount of new particles to spawn on this frame, based on elapsed time since last spawn
  let prvTime = Date.now(); // keep track of when a particle was last spawned
  let totalSpawnCount = 0; // spawnCount is additive on top of previous frame
  function particlesToSpawn(resetParticleSpawnCounter: boolean) {
    // if resetParticleSpawnCounter is true, no interpolation particles are created
    // get amount of particles that should have spawned during the duration of this frame
    const currentTime = Date.now();
    if (resetParticleSpawnCounter) prvTime = currentTime;
    const thisFrameCount = (currentTime - prvTime) / particleSpawnIntervalMS;
    prvTime = currentTime;

    // add to previous frame (there might be leftover)
    totalSpawnCount += thisFrameCount;
    if (totalSpawnCount >= 1) {
      // if 1 or more particles are to be spawned on this frame
      const floored = Math.floor(totalSpawnCount); // whole number of particles to spawn
      totalSpawnCount -= floored; // leftover particles for next frame
      return floored;
    }
    return 0;
  }

  // final animation
  const animate = () => {
    requestAnimationFrame(animate);

    // particles material needs the current time for comparison
    particlesMaterial.uniforms["currentTime"].value = getElapsedTime(); // seconds since page load

    requestParticles(lastMouseMoveEvent);
    // on touch & hold
    // if (activeTouchEvent) requestParticles(activeTouchEvent);
    // if (!isMobileDevice && lastMouseMoveEvent)
    //   requestParticles(lastMouseMoveEvent);

    controls.update();
    renderer.render(scene, camera);
  };
  animate();
}

main().catch(console.error);
