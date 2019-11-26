import * as THREE from 'three';

import {
  NodeMesh
} from './NodeMesh';

import {
  Block, BlockOptions
} from './Block';

import {
  Data
} from './Data';


/**
 * PolyMesh class
 */
export
class PolyMesh extends Block {

  constructor (vertices: Float32Array, triangleIndices: Uint32Array, data: Data[], options?: BlockOptions) {
    super(vertices, data, options);

    this.triangleIndices = triangleIndices;

    this.geometry = new THREE.BufferGeometry();
    this.initializeBufferGeometry();

    this.mesh = new NodeMesh(THREE.Mesh, this.geometry);
    this.meshes.push(this.mesh);

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
  }

  /**
   * Update vertices buffers
   */
  handleVerticesChange () {
    super.handleVerticesChange();

    this.vertexBuffer.set(this.vertices);
    this.vertexBuffer.needsUpdate = true;
  }

  get boundingSphere () : THREE.Sphere {
    this.geometry.computeBoundingSphere();
    return this.geometry.boundingSphere;
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

  constructor (vertices: Float32Array, triangleIndices: Uint32Array, tetrahedronIndices: Uint32Array, data: Data[], options?: BlockOptions) {
    super(vertices, triangleIndices, data, options);

    this.tetrahedronIndices = tetrahedronIndices;
  }

  tetrahedronIndices: Uint32Array;

}
