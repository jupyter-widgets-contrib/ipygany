import * as THREE from 'three';

import {
  NodeMesh
} from './NodeMesh';

import {
  Block
} from './Block';

import {
  Data
} from './Data';


/**
 * PolyMesh class
 */
export
class PolyMesh extends Block {

  constructor (vertices: Float32Array, triangleIndices: Uint32Array, data: Data[]) {
    super(vertices, data);

    this.triangleIndices = triangleIndices;

    this.geometry = new THREE.BufferGeometry();
    this.initializeBufferGeometry();

    this.mesh = new NodeMesh(THREE.Mesh, this.geometry);
    this.meshes.push(this.mesh);

    // Scale up or down the geometry (This should be removed, the scale should be global to the scene)
    this.geometry.computeBoundingSphere();
    const { radius } = this.geometry.boundingSphere;
    this.scale = new THREE.Vector3(1 / radius, 1 / radius, 1 / radius)

    this.buildMaterial();
  }

  /**
   * Initialize the buffer geometry
   */
  private initializeBufferGeometry () {
    this.vertexBuffer = new THREE.BufferAttribute(this.vertices, 3);
    this.indexBuffer = new THREE.BufferAttribute(this.triangleIndices, 1);

    this.geometry.setAttribute('position', this.vertexBuffer);
    this.geometry.setIndex(this.indexBuffer);
    this.geometry.center();
  }

  /**
   * Update vertices buffers
   */
  updateVertices (vertices: Float32Array) {
    super.updateVertices(vertices);

    this.vertexBuffer.set(vertices);
    this.vertexBuffer.needsUpdate = true;

    this.geometry.center();
  }

  triangleIndices: Uint32Array;

  geometry: THREE.BufferGeometry;
  private vertexBuffer: THREE.BufferAttribute;
  private indexBuffer: THREE.BufferAttribute;

  mesh: NodeMesh;

}


/**
 * TetraMesh class
 */
export
class TetraMesh extends PolyMesh {

  constructor (vertices: Float32Array, triangleIndices: Uint32Array, tetrahedronIndices: Uint32Array, data: Data[]) {
    super(vertices, triangleIndices, data);

    this.tetrahedronIndices = tetrahedronIndices;
  }

}
