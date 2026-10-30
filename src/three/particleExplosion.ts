import * as THREE from 'three';

export interface PooledExplosion {
  group: THREE.Group;
  sparks: THREE.Points;
  sparkPositions: Float32Array;
  sparkVelocities: Float32Array;
  debris: THREE.Points;
  debrisPositions: Float32Array;
  debrisVelocities: Float32Array;
  shockwave: THREE.Mesh;
  shockMat: THREE.MeshBasicMaterial;
  coreFlash: THREE.Mesh;
  flashMat: THREE.MeshBasicMaterial;
  age: number;
  maxAge: number;
  baseScale: number;
  active: boolean;
}

export class ParticleExplosionManager {
  private scene: THREE.Scene;
  private pool: PooledExplosion[] = [];
  private lastExplosionTime: number = 0;
  private poolSize = 6;
  private sparkCount = 32;
  private debrisCount = 12;

  // Shared geometries
  private flashGeo = new THREE.SphereGeometry(1.0, 10, 8);
  private shockGeo = new THREE.RingGeometry(0.8, 3.2, 20);

  // Shared points materials
  private sparkMat = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  private debrisMat = new THREE.PointsMaterial({
    size: 4.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPool();
  }

  private initPool() {
    for (let p = 0; p < this.poolSize; p++) {
      const group = new THREE.Group();
      group.visible = false;

      // 1. Core flash mesh with independent material for opacity fading
      const flashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coreFlash = new THREE.Mesh(this.flashGeo, flashMat);
      group.add(coreFlash);

      // 2. Shockwave mesh with independent material
      const shockMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const shockwave = new THREE.Mesh(this.shockGeo, shockMat);
      group.add(shockwave);

      // 3. Pre-allocated Sparks Points
      const sparkGeo = new THREE.BufferGeometry();
      const sparkPositions = new Float32Array(this.sparkCount * 3);
      const sparkVelocities = new Float32Array(this.sparkCount * 3);
      const sparkColors = new Float32Array(this.sparkCount * 3);

      for (let i = 0; i < this.sparkCount; i++) {
        const isHot = i % 3 !== 0;
        sparkColors[i * 3] = 1.0;
        sparkColors[i * 3 + 1] = isHot ? 0.85 : 0.45;
        sparkColors[i * 3 + 2] = isHot ? 0.25 : 0.08;
      }
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
      sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));
      const sparks = new THREE.Points(sparkGeo, this.sparkMat);
      group.add(sparks);

      // 4. Pre-allocated Debris Points
      const debrisGeo = new THREE.BufferGeometry();
      const debrisPositions = new Float32Array(this.debrisCount * 3);
      const debrisVelocities = new Float32Array(this.debrisCount * 3);
      const debrisColors = new Float32Array(this.debrisCount * 3);

      for (let i = 0; i < this.debrisCount; i++) {
        debrisColors[i * 3] = 0.9;
        debrisColors[i * 3 + 1] = 0.35;
        debrisColors[i * 3 + 2] = 0.12;
      }
      debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
      debrisGeo.setAttribute('color', new THREE.BufferAttribute(debrisColors, 3));
      const debris = new THREE.Points(debrisGeo, this.debrisMat);
      group.add(debris);

      this.scene.add(group);

      this.pool.push({
        group,
        sparks,
        sparkPositions,
        sparkVelocities,
        debris,
        debrisPositions,
        debrisVelocities,
        shockwave,
        shockMat,
        coreFlash,
        flashMat,
        age: 0,
        maxAge: 1.0,
        baseScale: 1.0,
        active: false,
      });
    }
  }

  public triggerExplosion(position: THREE.Vector3, scale: number = 1.0) {
    const now = performance.now();
    // Throttle rapid successive bursts to protect frame rates
    if (now - this.lastExplosionTime < 75) {
      return;
    }
    this.lastExplosionTime = now;

    // Find first inactive slot or reuse the oldest active slot
    let slot = this.pool.find((e) => !e.active);
    if (!slot) {
      let maxAge = -1;
      for (const e of this.pool) {
        if (e.age > maxAge) {
          maxAge = e.age;
          slot = e;
        }
      }
    }
    if (!slot) return;

    slot.active = true;
    slot.age = 0;
    slot.baseScale = Math.max(0.6, scale);
    slot.group.position.copy(position);
    slot.group.visible = true;

    // Reset core flash
    slot.coreFlash.visible = true;
    slot.coreFlash.scale.setScalar(3.0 * slot.baseScale);
    slot.flashMat.opacity = 1.0;

    // Reset shockwave
    slot.shockwave.scale.setScalar(slot.baseScale);
    slot.shockwave.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    slot.shockMat.opacity = 0.9;

    // Initialize Sparks in-place
    const sPos = slot.sparkPositions;
    const sVel = slot.sparkVelocities;
    for (let i = 0; i < this.sparkCount; i++) {
      const idx = i * 3;
      sPos[idx] = 0;
      sPos[idx + 1] = 0;
      sPos[idx + 2] = 0;

      const speed = (26 + Math.random() * 48) * slot.baseScale;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      sVel[idx] = speed * Math.sin(phi) * Math.cos(theta);
      sVel[idx + 1] = speed * Math.sin(phi) * Math.sin(theta);
      sVel[idx + 2] = speed * Math.cos(phi);
    }
    slot.sparks.geometry.attributes.position.needsUpdate = true;

    // Initialize Debris in-place
    const dPos = slot.debrisPositions;
    const dVel = slot.debrisVelocities;
    for (let i = 0; i < this.debrisCount; i++) {
      const idx = i * 3;
      dPos[idx] = (Math.random() - 0.5) * 1.5;
      dPos[idx + 1] = (Math.random() - 0.5) * 1.5;
      dPos[idx + 2] = (Math.random() - 0.5) * 1.5;

      const speed = (12 + Math.random() * 22) * slot.baseScale;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      dVel[idx] = speed * Math.sin(phi) * Math.cos(theta);
      dVel[idx + 1] = speed * Math.sin(phi) * Math.sin(theta);
      dVel[idx + 2] = speed * Math.cos(phi);
    }
    slot.debris.geometry.attributes.position.needsUpdate = true;
  }

  public update(delta: number) {
    for (let i = 0; i < this.poolSize; i++) {
      const slot = this.pool[i];
      if (!slot.active) continue;

      slot.age += delta;
      const progress = slot.age / slot.maxAge;

      if (progress >= 1.0) {
        slot.active = false;
        slot.group.visible = false;
        continue;
      }

      // 1. Expand core flash rapidly and fade out in first 0.22s
      if (slot.age < 0.22) {
        const flashScale = slot.baseScale * (1.0 + slot.age * 16);
        slot.coreFlash.scale.setScalar(flashScale);
        slot.flashMat.opacity = Math.max(0, 1.0 - slot.age / 0.22);
      } else {
        slot.coreFlash.visible = false;
      }

      // 2. Expand shockwave ring
      const shockScale = slot.baseScale * (1.0 + slot.age * 26);
      slot.shockwave.scale.setScalar(shockScale);
      slot.shockMat.opacity = Math.max(0, (1.0 - progress) * 0.85);

      // 3. Move Sparks outward using direct Float32Array array math (no object allocation)
      const sPos = slot.sparkPositions;
      const sVel = slot.sparkVelocities;
      for (let k = 0; k < this.sparkCount; k++) {
        const idx = k * 3;
        sVel[idx] *= 0.95;
        sVel[idx + 1] *= 0.95;
        sVel[idx + 2] *= 0.95;

        sPos[idx] += sVel[idx] * delta;
        sPos[idx + 1] += sVel[idx + 1] * delta;
        sPos[idx + 2] += sVel[idx + 2] * delta;
      }
      slot.sparks.geometry.attributes.position.needsUpdate = true;

      // 4. Move Debris
      const dPos = slot.debrisPositions;
      const dVel = slot.debrisVelocities;
      for (let m = 0; m < this.debrisCount; m++) {
        const idx = m * 3;
        dVel[idx] *= 0.96;
        dVel[idx + 1] *= 0.96;
        dVel[idx + 2] *= 0.96;

        dPos[idx] += dVel[idx] * delta;
        dPos[idx + 1] += dVel[idx + 1] * delta;
        dPos[idx + 2] += dVel[idx + 2] * delta;
      }
      slot.debris.geometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose() {
    for (const slot of this.pool) {
      this.scene.remove(slot.group);
      slot.sparks.geometry.dispose();
      slot.debris.geometry.dispose();
      slot.flashMat.dispose();
      slot.shockMat.dispose();
    }
    this.pool = [];
    this.flashGeo.dispose();
    this.shockGeo.dispose();
    this.sparkMat.dispose();
    this.debrisMat.dispose();
  }
}
