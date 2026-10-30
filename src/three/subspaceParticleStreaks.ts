// Relativistic Chromatic Particle Streaks System
// High-energy subspace quantum particles streaming along the warp vector.
// Specifically scales in frequency, particle count, chromatic dispersion,
// and speed as warpFactor exceeds 1.0 up to 9.9.

import * as THREE from 'three';

export class SubspaceParticleStreaks {
  public group: THREE.Group;
  private particleCount = 1500;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;

  // Particle Attributes
  private positions: Float32Array;
  private basePositions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private scales: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SubspaceParticleStreaks';

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.basePositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount);
    this.colors = new Float32Array(this.particleCount * 3);
    this.scales = new Float32Array(this.particleCount);

    // Initialize particles in a cylindrical envelope surrounding Enterprise
    for (let i = 0; i < this.particleCount; i++) {
      const radius = 18 + Math.pow(Math.random(), 1.4) * 140;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7; // Flattened ellipse matching Enterprise profile
      const z = (Math.random() - 0.5) * 600;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;

      this.velocities[i] = 0.7 + Math.random() * 0.8;
      this.scales[i] = 1.0 + Math.random() * 2.5;

      // Chromatic RGB dispersion spectrum for particles
      const colorType = Math.random();
      if (colorType < 0.45) {
        // Electric Cyan / Subspace Blue
        this.colors[i * 3] = 0.22;
        this.colors[i * 3 + 1] = 0.75;
        this.colors[i * 3 + 2] = 1.00;
      } else if (colorType < 0.75) {
        // Violet / Magenta Chromatic Fringe
        this.colors[i * 3] = 0.85;
        this.colors[i * 3 + 1] = 0.25;
        this.colors[i * 3 + 2] = 0.95;
      } else {
        // High-energy Emerald / Amber Relativistic Ion
        this.colors[i * 3] = 0.35;
        this.colors[i * 3 + 1] = 0.95;
        this.colors[i * 3 + 2] = 0.65;
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));

    // Particle vertex shader with speed elongation along Z
    const vertexShader = `
      attribute vec3 aColor;
      attribute float aScale;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uWarpFactor;
      uniform float uIntensity;

      void main() {
        vColor = aColor;
        vAlpha = uIntensity;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // Point size scales with warp factor and distance attenuation
        float factorScale = 1.0 + uWarpFactor * 0.35;
        gl_PointSize = (aScale * factorScale * 24.0) * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    // Particle fragment shader with soft circular falloff & chromatic core
    const fragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uWarpFactor;

      void main() {
        if (vAlpha < 0.01) discard;

        // Circular Gaussian point sprite
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        float strength = pow(1.0 - dist * 2.0, 1.8);

        // Core incandescent highlight
        vec3 finalColor = mix(vColor, vec3(1.0, 1.0, 1.0), strength * 0.55);

        gl_FragColor = vec4(finalColor, strength * vAlpha * 0.9);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWarpFactor: { value: 1.0 },
        uIntensity: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);
  }

  public update(delta: number, isWarping: boolean, warpFactor: number, time: number) {
    // Only active when warping AND warpFactor > 1.0
    const isWarpAboveOne = isWarping && warpFactor > 1.0;
    const factorNorm = Math.min(1.0, Math.max(0.0, (warpFactor - 1.0) / 8.9));

    // Intensity smoothly ramps up above Warp 1.0
    const targetIntensity = isWarpAboveOne ? THREE.MathUtils.lerp(0.35, 1.0, factorNorm) : 0.0;
    const currentIntensity = THREE.MathUtils.lerp(
      this.material.uniforms.uIntensity.value,
      targetIntensity,
      delta * 4.0
    );

    this.material.uniforms.uIntensity.value = currentIntensity;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uWarpFactor.value = warpFactor;

    this.group.visible = currentIntensity > 0.01;
    if (!this.group.visible) return;

    // Streaming velocity along Z-axis in local ship frame
    // Speed scales strongly with warp factor
    const streamSpeed = delta * (320 + factorNorm * 1400);
    const posAttr = this.geometry.attributes.position;

    for (let i = 0; i < this.particleCount; i++) {
      let z = this.positions[i * 3 + 2];
      const vel = this.velocities[i];

      // Stream particles towards aft (+Z in ship local frame)
      z += streamSpeed * vel;
      if (z > 300) {
        z -= 600;
      }

      this.positions[i * 3 + 2] = z;
      posAttr.setZ(i, z);
    }

    posAttr.needsUpdate = true;
  }
}
