// Starfleet Cinematic Warp Drive Visual Effects System
// Authentic Star Trek subspace warp bubble, chromatic relativistic streaks,
// continuous warp flash/burst flares that dynamically intensify with warp factor,
// forward deflector beam, and warp compression rings.
// Integrated with Shader-Based Subspace Distortion Field & Relativistic Particle Streaks
// which activate specifically when warp factor > 1.0!

import * as THREE from 'three';
import { createSubspaceDistortionMaterial } from './subspaceDistortionShader';
import { SubspaceParticleStreaks } from './subspaceParticleStreaks';

export interface WarpEffectState {
  isWarping: boolean;
  warpFactor: number;
  shipPosition: THREE.Vector3;
  shipOrientation: THREE.Quaternion;
  shipForward: THREE.Vector3;
}

export class WarpEffectManager {
  public group: THREE.Group;

  // Star Streaks System
  private streakCount = 1200;
  private streakGeo: THREE.BufferGeometry;
  private streakMat: THREE.LineBasicMaterial;
  private streakLines: THREE.LineSegments;
  private baseStreakPositions: Float32Array; // [x, y, z] in ship-local coordinates
  private streakPositions: Float32Array;

  // Warp Bubble (Subspace Energy Field around Enterprise)
  private warpBubbleGroup: THREE.Group;
  private warpBubbleMesh: THREE.Mesh;
  private warpBubbleMat: THREE.MeshBasicMaterial;
  private outerBubbleMesh: THREE.Mesh;
  private outerBubbleMat: THREE.MeshBasicMaterial;
  private energyWaveMesh: THREE.Mesh;
  private energyWaveMat: THREE.MeshBasicMaterial;

  // Shader-Based Subspace Distortion Field (Specifically active when warpFactor > 1.0)
  private subspaceDistortionMesh: THREE.Mesh;
  private subspaceDistortionMat: THREE.ShaderMaterial;

  // Relativistic Chromatic Particle Streaks System (Active when warpFactor > 1.0)
  private particleStreaks: SubspaceParticleStreaks;

  // Continuous Subspace Compression Rings (Traveling aft)
  private distortionRings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; localZ: number; speed: number; baseRadius: number }[] = [];

  // Warp Flash Flare (Camera-facing acceleration burst & continuous high-warp energetic corona)
  private flashGroup: THREE.Group;
  private flashCoreMesh: THREE.Mesh;
  private flashCoreMat: THREE.MeshBasicMaterial;
  private flashHaloMesh: THREE.Mesh;
  private flashHaloMat: THREE.MeshBasicMaterial;
  private flashSecondaryMesh: THREE.Mesh;
  private flashSecondaryMat: THREE.MeshBasicMaterial;

  // Forward Tunnel Glow / Star Trek Deflector Warp Sheath
  private tunnelGlowMesh: THREE.Mesh;
  private tunnelGlowMat: THREE.MeshBasicMaterial;

  // Dynamic state
  private flashIntensity: number = 0;
  private flashScale: number = 1.0;
  private prevWarping: boolean = false;
  private prevWarpFactor: number = 1.0;
  private warpTransitionProgress: number = 0; // 0 (impulse) to 1 (full warp)
  private exitDecelProgress: number = 0; // 1 (just dropped) down to 0
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'CinematicWarpSystem';
    scene.add(this.group);

    // 1. Relativistic Star Streaks (Spanning along ship forward/backward axis in local space)
    this.streakGeo = new THREE.BufferGeometry();
    this.streakPositions = new Float32Array(this.streakCount * 6);
    this.baseStreakPositions = new Float32Array(this.streakCount * 3);

    for (let i = 0; i < this.streakCount; i++) {
      // Cylindrical distribution around ship flight path
      const r = 24 + Math.pow(Math.random(), 1.25) * 420;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      // Z spans from -800 to +600 relative to ship center
      const z = (Math.random() - 0.5) * 1400;

      this.baseStreakPositions[i * 3] = x;
      this.baseStreakPositions[i * 3 + 1] = y;
      this.baseStreakPositions[i * 3 + 2] = z;

      this.streakPositions[i * 6] = x;
      this.streakPositions[i * 6 + 1] = y;
      this.streakPositions[i * 6 + 2] = z;
      this.streakPositions[i * 6 + 3] = x;
      this.streakPositions[i * 6 + 4] = y;
      this.streakPositions[i * 6 + 5] = z;
    }

    this.streakGeo.setAttribute('position', new THREE.BufferAttribute(this.streakPositions, 3));

    this.streakMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.streakLines = new THREE.LineSegments(this.streakGeo, this.streakMat);
    this.group.add(this.streakLines);

    // 2. Shimmering Subspace Warp Bubble around Enterprise
    this.warpBubbleGroup = new THREE.Group();
    this.warpBubbleGroup.visible = false;

    const bubbleGeo = new THREE.SphereGeometry(1, 32, 24);

    // Inner Warp Bubble Shell (Smooth luminous subspace envelope)
    this.warpBubbleMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.warpBubbleMesh = new THREE.Mesh(bubbleGeo, this.warpBubbleMat);
    this.warpBubbleMesh.scale.set(26, 16, 44);
    this.warpBubbleGroup.add(this.warpBubbleMesh);

    // Outer Shimmering Subspace Boundary
    this.outerBubbleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.outerBubbleMesh = new THREE.Mesh(bubbleGeo, this.outerBubbleMat);
    this.outerBubbleMesh.scale.set(29, 18, 48);
    this.warpBubbleGroup.add(this.outerBubbleMesh);

    // Energy Wave Sheath (Fluctuating harmonic ripples)
    this.energyWaveMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.energyWaveMesh = new THREE.Mesh(bubbleGeo, this.energyWaveMat);
    this.energyWaveMesh.scale.set(32, 20, 52);
    this.warpBubbleGroup.add(this.energyWaveMesh);

    this.group.add(this.warpBubbleGroup);

    // 3. Shader-Based Subspace Distortion Field Envelope (Specifically active when warpFactor > 1.0)
    // Custom ellipsoidal sheath enclosing the Enterprise with GLSL chromatic aberration & refractive noise
    const distortionFieldGeo = new THREE.SphereGeometry(1, 48, 36);
    this.subspaceDistortionMat = createSubspaceDistortionMaterial();
    this.subspaceDistortionMesh = new THREE.Mesh(distortionFieldGeo, this.subspaceDistortionMat);
    this.subspaceDistortionMesh.scale.set(31, 19, 50);
    this.subspaceDistortionMesh.visible = false;
    this.group.add(this.subspaceDistortionMesh);

    // 4. Relativistic Chromatic Particle Streaks System (Active when warpFactor > 1.0)
    this.particleStreaks = new SubspaceParticleStreaks();
    this.group.add(this.particleStreaks.group);

    // 5. Subspace Compression Distortion Rings
    const ringGeo = new THREE.TorusGeometry(48, 1.6, 12, 40);
    for (let r = 0; r < 6; r++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2; // Flat ring perpendicular to forward travel
      this.distortionRings.push({
        mesh: ringMesh,
        mat: ringMat,
        localZ: -240 + r * 130,
        speed: 1.0 + r * 0.18,
        baseRadius: 48,
      });
      this.group.add(ringMesh);
    }

    // 6. Forward Warp Tunnel Glow / Star Trek Deflector Beam Corridor
    const tunnelGeo = new THREE.CylinderGeometry(35, 120, 800, 24, 1, true);
    this.tunnelGlowMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.tunnelGlowMesh = new THREE.Mesh(tunnelGeo, this.tunnelGlowMat);
    this.tunnelGlowMesh.rotation.x = Math.PI / 2;
    this.tunnelGlowMesh.position.set(0, 0, -420); // Extends forward in direction of travel
    this.group.add(this.tunnelGlowMesh);

    // 7. Warp Flash Flare & High-Warp Corona
    this.flashGroup = new THREE.Group();
    this.flashGroup.visible = false;

    // Core Flash Disk
    const coreGeo = new THREE.CircleGeometry(26, 32);
    this.flashCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.flashCoreMesh = new THREE.Mesh(coreGeo, this.flashCoreMat);
    this.flashGroup.add(this.flashCoreMesh);

    // Horizontal Anamorphic Lens Flare
    const haloGeo = new THREE.RingGeometry(18, 65, 36);
    this.flashHaloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.flashHaloMesh = new THREE.Mesh(haloGeo, this.flashHaloMat);
    this.flashGroup.add(this.flashHaloMesh);

    // Electric Sapphire Halo for high warp
    const secGeo = new THREE.RingGeometry(28, 90, 36);
    this.flashSecondaryMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.flashSecondaryMesh = new THREE.Mesh(secGeo, this.flashSecondaryMat);
    this.flashGroup.add(this.flashSecondaryMesh);

    this.group.add(this.flashGroup);
  }

  // Trigger sudden Star Trek acceleration flash when jumping into warp or shifting up
  public triggerWarpEngagementFlash(intensity: number = 1.0) {
    this.flashIntensity = Math.max(this.flashIntensity, intensity);
    this.flashScale = 1.0;
  }

  // Trigger soft deceleration flash when dropping from warp
  public triggerWarpExitFlash() {
    this.flashIntensity = 0.85;
    this.flashScale = 0.8;
    this.exitDecelProgress = 1.0;
  }

  // Main per-frame update
  public update(
    delta: number,
    isWarping: boolean,
    warpFactor: number,
    shipPos: THREE.Vector3,
    shipQuat: THREE.Quaternion,
    cameraPos?: THREE.Vector3
  ) {
    this.time += delta;

    // Detect warp state changes
    if (isWarping && !this.prevWarping) {
      this.triggerWarpEngagementFlash(1.2);
    } else if (!isWarping && this.prevWarping) {
      this.triggerWarpExitFlash();
    }

    this.prevWarping = isWarping;
    this.prevWarpFactor = warpFactor;

    // Warp factor normalized parameter [0.1 .. 1.0]
    const factorNorm = Math.min(1.0, Math.max(0.1, warpFactor / 9.9));

    // Smooth transition progress
    if (isWarping) {
      this.warpTransitionProgress = THREE.MathUtils.lerp(this.warpTransitionProgress, 1.0, delta * 3.8);
      this.exitDecelProgress = 0;
    } else {
      this.warpTransitionProgress = THREE.MathUtils.lerp(this.warpTransitionProgress, 0.0, delta * 4.5);
      if (this.exitDecelProgress > 0) {
        this.exitDecelProgress = Math.max(0, this.exitDecelProgress - delta * 2.2);
      }
    }

    const isEffectActive =
      this.warpTransitionProgress > 0.01 ||
      this.exitDecelProgress > 0.01 ||
      this.flashIntensity > 0.01;

    this.group.visible = isEffectActive;
    if (!isEffectActive) return;

    // Always strictly lock the warp effect root to the ship's world position and rotation
    this.group.position.copy(shipPos);
    this.group.quaternion.copy(shipQuat);

    // --- 1. SHADER-BASED SUBSPACE DISTORTION FIELD & CHROMATIC ABERRATION ---
    // Activates specifically when warpFactor > 1.0 during active warp!
    const isWarpAboveOne = isWarping && warpFactor > 1.0 && this.warpTransitionProgress > 0.05;
    // Normalized factor above Warp 1.0 [0.0 at Warp 1.0, 1.0 at Warp 9.9]
    const aboveOneNorm = isWarpAboveOne ? Math.min(1.0, Math.max(0.0, (warpFactor - 1.0) / 8.9)) : 0.0;

    // Calculate dynamic shader intensity, oscillation frequency & chromatic separation
    const targetShaderIntensity = isWarpAboveOne ? THREE.MathUtils.lerp(0.25, 1.0, aboveOneNorm) : 0.0;
    const currentShaderIntensity = THREE.MathUtils.lerp(
      this.subspaceDistortionMat.uniforms.uIntensity.value,
      targetShaderIntensity * this.warpTransitionProgress,
      delta * 4.5
    );

    // Oscillation frequency scales from 1.0 up to 4.5 at maximum warp
    const targetFrequency = 1.0 + aboveOneNorm * 3.5;
    // Chromatic aberration separation increases as warp factor scales up
    const targetChromatic = aboveOneNorm * (0.8 + aboveOneNorm * 1.4);

    this.subspaceDistortionMat.uniforms.uTime.value = this.time;
    this.subspaceDistortionMat.uniforms.uWarpFactor.value = warpFactor;
    this.subspaceDistortionMat.uniforms.uIntensity.value = currentShaderIntensity;
    this.subspaceDistortionMat.uniforms.uFrequency.value = targetFrequency;
    this.subspaceDistortionMat.uniforms.uChromaticSeparation.value = targetChromatic;
    if (cameraPos) {
      this.subspaceDistortionMat.uniforms.uCameraPos.value.copy(cameraPos);
    }

    this.subspaceDistortionMesh.visible = currentShaderIntensity > 0.005;

    // --- 2. RELATIVISTIC CHROMATIC PARTICLE STREAKS ---
    // Micro-particles streaming through distortion field, scaling with warpFactor > 1
    this.particleStreaks.update(delta, isWarping, warpFactor, this.time);

    // --- 3. DYNAMIC LIGHT FLASHING ABOUT THE SHIP ---
    // Flashing rate scales directly with warp factor (from gentle rhythmic pulse at Warp 1.0
    // to rapid, brilliant energetic flashing at Warp 9.9) as requested!
    // Pulse frequency: 3.5 Hz at Warp 1, up to 26 Hz at Warp 9.9
    const flashPulseFrequency = 3.5 + factorNorm * 22.0;
    const rhythmicFlash = isWarping
      ? Math.pow((Math.sin(this.time * flashPulseFrequency) + 1.0) * 0.5, 2.5) * (0.35 + factorNorm * 0.55)
      : 0;

    // Momentary surge burst (e.g. On engage or dropping)
    if (this.flashIntensity > 0.01) {
      this.flashIntensity = Math.max(0, this.flashIntensity - delta * 3.0);
      this.flashScale += delta * 4.5;
    }

    const totalFlash = Math.min(1.0, this.flashIntensity + rhythmicFlash);

    if (totalFlash > 0.02) {
      this.flashGroup.visible = true;

      // Scale remains controlled and consistent so it never covers or displaces the ship view
      const baseScale = 1.0 + factorNorm * 0.4;
      const flashScaleNow = (this.flashIntensity > 0.1 ? this.flashScale * 0.8 : 1.0) * baseScale;

      this.flashCoreMat.opacity = Math.min(0.9, totalFlash * 0.85);
      this.flashHaloMat.opacity = Math.min(0.85, totalFlash * 0.9);
      this.flashSecondaryMat.opacity = Math.min(0.7, totalFlash * 0.75);

      this.flashCoreMesh.scale.setScalar(flashScaleNow * 1.1);
      this.flashHaloMesh.scale.set(flashScaleNow * 2.2, flashScaleNow * 0.5, 1);
      this.flashSecondaryMesh.scale.set(flashScaleNow * 2.8, flashScaleNow * 0.8, 1);

      // Flashing colors
      if (warpFactor >= 8.0) {
        this.flashHaloMat.color.setHex(0xe0f2fe);
        this.flashSecondaryMat.color.setHex(0x38bdf8);
      } else if (warpFactor >= 4.0) {
        this.flashHaloMat.color.setHex(0x38bdf8);
        this.flashSecondaryMat.color.setHex(0x60a5fa);
      } else {
        this.flashHaloMat.color.setHex(0x0284c7);
        this.flashSecondaryMat.color.setHex(0x0369a1);
      }

      this.flashGroup.position.set(0, 1.2, 2.0);

      if (cameraPos) {
        const localCam = cameraPos.clone().sub(shipPos).applyQuaternion(shipQuat.clone().invert());
        this.flashGroup.lookAt(localCam);
      }
    } else {
      this.flashGroup.visible = false;
    }

    // --- 4. Shimmering Subspace Warp Bubble around Enterprise ---
    if (this.warpTransitionProgress > 0.02) {
      this.warpBubbleGroup.visible = true;

      // Base opacity scales with warp factor
      const baseBubbleOpacity = THREE.MathUtils.lerp(0.12, 0.48, factorNorm);
      // Shimmer frequency directly proportional to warp factor
      const pulseRate = 6.0 + factorNorm * 28.0;
      const shimmer = Math.sin(this.time * pulseRate) * 0.12 + Math.cos(this.time * (pulseRate * 1.6)) * 0.06;
      this.warpBubbleMat.opacity = Math.max(0, (baseBubbleOpacity + shimmer) * this.warpTransitionProgress);

      // Wireframe ripple shell
      this.outerBubbleMat.opacity = Math.max(0, (baseBubbleOpacity * 0.5 + shimmer * 0.5) * this.warpTransitionProgress);

      // Harmonic energy ripple wave
      const wavePulse = (Math.sin(this.time * 8 + factorNorm * 6) + 1) * 0.5;
      this.energyWaveMat.opacity = Math.max(0, factorNorm * 0.28 * wavePulse * this.warpTransitionProgress);
      this.energyWaveMesh.scale.set(
        28 + factorNorm * 6 + wavePulse * 2,
        18 + factorNorm * 4 + wavePulse * 1.5,
        46 + factorNorm * 10 + wavePulse * 3
      );

      // Color shifts towards brilliant sapphire/electric-white at high warp
      if (warpFactor >= 9.0) {
        this.warpBubbleMat.color.setHex(0x93c5fd);
        this.outerBubbleMat.color.setHex(0xf0f9ff);
        this.energyWaveMat.color.setHex(0x38bdf8);
      } else if (warpFactor >= 6.0) {
        this.warpBubbleMat.color.setHex(0x38bdf8);
        this.outerBubbleMat.color.setHex(0xbae6fd);
        this.energyWaveMat.color.setHex(0x0284c7);
      } else {
        this.warpBubbleMat.color.setHex(0x0284c7);
        this.outerBubbleMat.color.setHex(0x38bdf8);
        this.energyWaveMat.color.setHex(0x0369a1);
      }
    } else {
      this.warpBubbleGroup.visible = false;
    }

    // --- 5. Forward Warp Tunnel Glow / Deflector Corridor ---
    if (this.warpTransitionProgress > 0.04) {
      const tunnelOpacity = THREE.MathUtils.lerp(0.04, 0.32, factorNorm) * this.warpTransitionProgress;
      this.tunnelGlowMat.opacity = tunnelOpacity;
      if (warpFactor >= 8.0) {
        this.tunnelGlowMat.color.setHex(0x38bdf8);
      } else if (warpFactor >= 5.0) {
        this.tunnelGlowMat.color.setHex(0x0284c7);
      } else {
        this.tunnelGlowMat.color.setHex(0x0369a1);
      }
    } else {
      this.tunnelGlowMat.opacity = 0;
    }

    // --- 6. Relativistic Star Streaks Animation & Deceleration Contraction ---
    const speedMult = Math.pow(factorNorm, 2.0) * 18.0 + 2.0;
    const baseSpeed = 380 * speedMult;

    let maxStreakLength = 45 + Math.pow(factorNorm, 2.3) * 1350;

    if (!isWarping && this.exitDecelProgress > 0) {
      maxStreakLength *= this.exitDecelProgress;
    }

    const currentStreakLength = maxStreakLength * Math.max(this.warpTransitionProgress, this.exitDecelProgress);

    const targetStreakOpacity = THREE.MathUtils.lerp(0.55, 0.95, factorNorm);
    const effectiveOpacity = targetStreakOpacity * Math.max(this.warpTransitionProgress, this.exitDecelProgress);
    this.streakMat.opacity = effectiveOpacity;

    if (warpFactor >= 9.0) {
      this.streakMat.color.setHex(0xf0f9ff);
    } else if (warpFactor >= 6.0) {
      this.streakMat.color.setHex(0x7dd3fc);
    } else {
      this.streakMat.color.setHex(0x60a5fa);
    }

    const posAttr = this.streakGeo.attributes.position;
    const streamZSpeed = delta * baseSpeed;

    for (let i = 0; i < this.streakCount; i++) {
      const bx = this.baseStreakPositions[i * 3];
      const by = this.baseStreakPositions[i * 3 + 1];
      let bz = this.baseStreakPositions[i * 3 + 2];

      if (isWarping) {
        bz += streamZSpeed;
        if (bz > 500) {
          bz -= 1300;
        }
        this.baseStreakPositions[i * 3 + 2] = bz;
      }

      posAttr.setXYZ(i * 2, bx, by, bz);
      const tailZ = bz - currentStreakLength;
      posAttr.setXYZ(i * 2 + 1, bx, by, tailZ);
    }
    posAttr.needsUpdate = true;

    // --- 7. Subspace Compression Distortion Rings ---
    const ringSpeedMult = 280 * (1 + factorNorm * 3.2);
    const ringOpacity = THREE.MathUtils.lerp(0.08, 0.42, factorNorm) * this.warpTransitionProgress;

    for (let r = 0; r < this.distortionRings.length; r++) {
      const ring = this.distortionRings[r];
      if (this.warpTransitionProgress > 0.05) {
        ring.localZ -= delta * ringSpeedMult * ring.speed;
        if (ring.localZ < -600) {
          ring.localZ += 1050;
        }
        ring.mesh.position.set(0, 0, ring.localZ);
        ring.mat.opacity = ringOpacity;

        const pulseScale = 1.0 + Math.sin(this.time * 6 + r) * 0.12 + factorNorm * 0.2;
        ring.mesh.scale.setScalar(pulseScale);
      } else {
        ring.mat.opacity = 0;
      }
    }
  }

  // Camera FOV offset: returns 0 so camera perspective and framing remain 100% constant across all warp factors!
  public getWarpFovOffset(_warpFactor: number): number {
    return 0;
  }
}
