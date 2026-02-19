import * as THREE from 'three'

/**
 * Simple collision detection using Octree
 * Based on Three.js examples/jsm/math/Octree
 */

// Capsule class for player collider
export class Capsule {
  start: THREE.Vector3
  end: THREE.Vector3
  radius: number

  constructor(
    start = new THREE.Vector3(0, 0.35, 0),
    end = new THREE.Vector3(0, 1.5, 0),
    radius = 0.35
  ) {
    this.start = start.clone()
    this.end = end.clone()
    this.radius = radius
  }

  clone() {
    return new Capsule(this.start.clone(), this.end.clone(), this.radius)
  }

  set(start: THREE.Vector3, end: THREE.Vector3, radius: number) {
    this.start.copy(start)
    this.end.copy(end)
    this.radius = radius
  }

  getCenter(target: THREE.Vector3) {
    return target.copy(this.start).add(this.end).multiplyScalar(0.5)
  }

  translate(offset: THREE.Vector3) {
    this.start.add(offset)
    this.end.add(offset)
  }
}

// Simple triangle for collision
interface CollisionTriangle {
  a: THREE.Vector3
  b: THREE.Vector3
  c: THREE.Vector3
  normal: THREE.Vector3
}

// Collision result
export interface CollisionResult {
  normal: THREE.Vector3
  depth: number
}

/**
 * Simple Octree for spatial partitioning and collision detection
 */
export class SimpleOctree {
  private triangles: CollisionTriangle[] = []
  private bounds: THREE.Box3 = new THREE.Box3()
  private _v1 = new THREE.Vector3()
  private _v2 = new THREE.Vector3()
  private _plane = new THREE.Plane()
  private _closestPoint = new THREE.Vector3()

  /**
   * Build octree from a mesh or group of meshes
   */
  fromMesh(mesh: THREE.Object3D) {
    mesh.updateWorldMatrix(true, true)
    
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry
        
        if (!geometry.isBufferGeometry) return
        
        const positionAttribute = geometry.getAttribute('position')
        const indexAttribute = geometry.getIndex()
        
        if (!positionAttribute) return
        
        const worldMatrix = child.matrixWorld
        
        if (indexAttribute) {
          // Indexed geometry
          for (let i = 0; i < indexAttribute.count; i += 3) {
            const a = new THREE.Vector3().fromBufferAttribute(positionAttribute, indexAttribute.getX(i))
            const b = new THREE.Vector3().fromBufferAttribute(positionAttribute, indexAttribute.getX(i + 1))
            const c = new THREE.Vector3().fromBufferAttribute(positionAttribute, indexAttribute.getX(i + 2))
            
            a.applyMatrix4(worldMatrix)
            b.applyMatrix4(worldMatrix)
            c.applyMatrix4(worldMatrix)
            
            this.addTriangle(a, b, c)
          }
        } else {
          // Non-indexed geometry
          for (let i = 0; i < positionAttribute.count; i += 3) {
            const a = new THREE.Vector3().fromBufferAttribute(positionAttribute, i)
            const b = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 1)
            const c = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 2)
            
            a.applyMatrix4(worldMatrix)
            b.applyMatrix4(worldMatrix)
            c.applyMatrix4(worldMatrix)
            
            this.addTriangle(a, b, c)
          }
        }
      }
    })
    
    // Debug: console.log(`[Octree] Built from mesh with ${this.triangles.length} triangles`)
    return this
  }

  private addTriangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
    const normal = new THREE.Vector3()
    this._v1.subVectors(b, a)
    this._v2.subVectors(c, a)
    normal.crossVectors(this._v1, this._v2).normalize()
    
    this.triangles.push({ a, b, c, normal })
    
    this.bounds.expandByPoint(a)
    this.bounds.expandByPoint(b)
    this.bounds.expandByPoint(c)
  }

  /**
   * Check capsule collision against all triangles
   * Returns the deepest collision to handle properly
   */
  capsuleIntersect(capsule: Capsule): CollisionResult | null {
    let result: CollisionResult | null = null
    let maxDepth = 0

    for (const triangle of this.triangles) {
      const collision = this.capsuleTriangleIntersect(capsule, triangle)
      if (collision && collision.depth > maxDepth) {
        // Only consider collisions with reasonable depth
        if (collision.depth < 2.0) { // Ignore if we're somehow deep inside
          maxDepth = collision.depth
          result = collision
        }
      }
    }

    return result
  }

  private capsuleTriangleIntersect(capsule: Capsule, triangle: CollisionTriangle): CollisionResult | null {
    // Project capsule line segment onto triangle plane
    this._plane.setFromNormalAndCoplanarPoint(triangle.normal, triangle.a)
    
    const d1 = this._plane.distanceToPoint(capsule.start)
    const d2 = this._plane.distanceToPoint(capsule.end)
    
    // Both endpoints on same side and far from plane
    if ((d1 > capsule.radius && d2 > capsule.radius) || 
        (d1 < -capsule.radius && d2 < -capsule.radius)) {
      return null
    }
    
    // Find closest point on capsule to triangle
    const denom = Math.abs(d1) + Math.abs(d2)
    const t = denom === 0 ? 0.5 : Math.abs(d1) / denom
    this._closestPoint.copy(capsule.start).lerp(capsule.end, t)
    
    // Get closest point on triangle
    const closestOnTriangle = this.closestPointOnTriangle(
      this._closestPoint, 
      triangle.a, 
      triangle.b, 
      triangle.c
    )
    
    // Check distance
    const distance = this._closestPoint.distanceTo(closestOnTriangle)
    
    if (distance < capsule.radius) {
      const depth = capsule.radius - distance
      const normal = new THREE.Vector3()
        .subVectors(this._closestPoint, closestOnTriangle)
        .normalize()
      
      return { normal, depth }
    }
    
    return null
  }

  private closestPointOnTriangle(
    point: THREE.Vector3,
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3
  ): THREE.Vector3 {
    const result = new THREE.Vector3()
    const ab = this._v1.subVectors(b, a)
    const ac = this._v2.subVectors(c, a)
    const ap = new THREE.Vector3().subVectors(point, a)

    const d1 = ab.dot(ap)
    const d2 = ac.dot(ap)
    if (d1 <= 0 && d2 <= 0) return result.copy(a)

    const bp = new THREE.Vector3().subVectors(point, b)
    const d3 = ab.dot(bp)
    const d4 = ac.dot(bp)
    if (d3 >= 0 && d4 <= d3) return result.copy(b)

    const vc = d1 * d4 - d3 * d2
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3)
      return result.copy(a).addScaledVector(ab, v)
    }

    const cp = new THREE.Vector3().subVectors(point, c)
    const d5 = ab.dot(cp)
    const d6 = ac.dot(cp)
    if (d6 >= 0 && d5 <= d6) return result.copy(c)

    const vb = d5 * d2 - d1 * d6
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6)
      return result.copy(a).addScaledVector(ac, w)
    }

    const va = d3 * d6 - d5 * d4
    if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
      const w = (d4 - d3) / ((d4 - d3) + (d5 - d6))
      return result.copy(b).addScaledVector(new THREE.Vector3().subVectors(c, b), w)
    }

    const denom = 1 / (va + vb + vc)
    const vn = vb * denom
    const wn = vc * denom
    return result.copy(a).addScaledVector(ab, vn).addScaledVector(ac, wn)
  }

  /**
   * Get bounding box
   */
  getBounds(): THREE.Box3 {
    return this.bounds.clone()
  }

  /**
   * Get triangle count
   */
  getTriangleCount(): number {
    return this.triangles.length
  }
}
