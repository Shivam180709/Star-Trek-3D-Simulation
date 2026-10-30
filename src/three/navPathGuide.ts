import * as THREE from 'three';

/**
 * Procedural Navigational Dotted-Line Path Guide
 * Renders a glowing dotted trajectory line from the starship's bow directly to the selected target.
 * Enables the pilot to manually fly and steer the Enterprise along the dotted corridor.
 * Automatically fades and removes the dotted path once the starship arrives near the target.
 */
export class NavPathGuide {
  public group: THREE.Group;
  private lineMesh: THREE.Line;
  private lineGeo: THREE.BufferGeometry;
  private lineMat: THREE.LineDashedMaterial;

  private dotsMesh: THREE.InstancedMesh;
  private dotCount: number = 70;
  private dummy: THREE.Object3D = new THREE.Object3D();

  private isNear: boolean = false;
  private currentOpacity: number = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'Enterprise_NavPathGuide';

    // 1. Dashed trajectory line
    this.lineGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(2 * 3);
    this.lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 14,
      gapSize: 9,
      linewidth: 2,
      scale: 1,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.lineMesh = new THREE.Line(this.lineGeo, this.lineMat);
    this.group.add(this.lineMesh);

    // 2. High-visibility glowing waypoint beads along the dotted line
    const sphereGeo = new THREE.SphereGeometry(1.25, 12, 12);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.dotsMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, this.dotCount);
    this.dotsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.dotsMesh);

    this.group.visible = false;
    scene.add(this.group);
  }

  /**
   * Updates the dotted line trajectory from the ship to the target.
   * If the ship is within nearThreshold of the destination, removes (hides) the dotted line.
   */
  public update(
    shipPos: THREE.Vector3,
    forwardDir: THREE.Vector3,
    targetPos: THREE.Vector3 | null,
    targetRadius: number = 30,
    delta: number = 0.016,
    time: number = 0
  ) {
    if (!targetPos) {
      this.currentOpacity = Math.max(0, this.currentOpacity - delta * 4);
      if (this.currentOpacity <= 0.01) {
        this.group.visible = false;
      } else {
        this.lineMat.opacity = this.currentOpacity * 0.85;
        (this.dotsMesh.material as THREE.MeshBasicMaterial).opacity = this.currentOpacity * 0.9;
      }
      return;
    }

    // Near-target proximity calculation
    const nearThreshold = Math.max(130, targetRadius * 2.6);
    const distToTarget = shipPos.distanceTo(targetPos);

    if (distToTarget <= nearThreshold) {
      // User requested: "remove the this dotted line is the ship is near to that is"
      this.isNear = true;
      this.currentOpacity = Math.max(0, this.currentOpacity - delta * 3.5);
      if (this.currentOpacity <= 0.01) {
        this.group.visible = false;
        return;
      }
    } else {
      this.isNear = false;
      this.currentOpacity = Math.min(1.0, this.currentOpacity + delta * 3.0);
      this.group.visible = true;
    }

    this.lineMat.opacity = this.currentOpacity * 0.85;
    (this.dotsMesh.material as THREE.MeshBasicMaterial).opacity = this.currentOpacity * 0.9;

    // Start slightly in front of the Enterprise saucer bow
    const startPos = shipPos.clone().add(forwardDir.clone().multiplyScalar(4.5));
    const endPos = targetPos.clone();

    // Update dashed line endpoints
    const posAttr = this.lineGeo.attributes.position as THREE.BufferAttribute;
    posAttr.setXYZ(0, startPos.x, startPos.y, startPos.z);
    posAttr.setXYZ(1, endPos.x, endPos.y, endPos.z);
    posAttr.needsUpdate = true;
    this.lineMesh.computeLineDistances();

    // Update glowing dotted waypoint beads along the path with forward flow animation
    const dir = endPos.clone().sub(startPos);
    const totalDist = dir.length();
    const unitDir = dir.normalize();

    // Forward traveling flow pulse
    const speed = 25; // units/sec pulse travel
    const stepDist = 32; // distance between dots
    const actualDots = Math.min(this.dotCount, Math.floor(totalDist / stepDist));

    const flowOffset = (time * speed) % stepDist;

    for (let i = 0; i < this.dotCount; i++) {
      if (i < actualDots) {
        const d = (i * stepDist + flowOffset);
        if (d > 0 && d < totalDist - 15) {
          const pt = startPos.clone().add(unitDir.clone().multiplyScalar(d));
          this.dummy.position.copy(pt);
          
          // Subtle pulse size scaling along distance
          const scale = 1.0 + Math.sin(time * 3 + i * 0.4) * 0.25;
          this.dummy.scale.set(scale, scale, scale);
          this.dummy.updateMatrix();
          this.dotsMesh.setMatrixAt(i, this.dummy.matrix);
          continue;
        }
      }
      // Collapse unused dots
      this.dummy.position.set(0, -999999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.dotsMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.dotsMesh.instanceMatrix.needsUpdate = true;
  }

  public dispose() {
    this.lineGeo.dispose();
    this.lineMat.dispose();
    this.dotsMesh.geometry.dispose();
    (this.dotsMesh.material as THREE.Material).dispose();
  }
}
