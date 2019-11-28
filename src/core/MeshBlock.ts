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

    const vertexBuffer = new THREE.BufferAttribute(this.vertices, 3);
    const indexBuffer = new THREE.BufferAttribute(this.triangleIndices, 1);

    this.geometry.setAttribute('position', vertexBuffer);
    this.geometry.setIndex(indexBuffer);

    this.mesh = new NodeMesh(THREE.Mesh, this.geometry, this.data);
    this.meshes.push(this.mesh);

    this.buildMaterial();
  }

  /**
   * Update vertices buffers
   */
  handleVerticesChange () {
    super.handleVerticesChange();

    this.mesh.vertices = this.vertices;
  }

  get boundingSphere () : THREE.Sphere {
    this.geometry.computeBoundingSphere();
    return this.geometry.boundingSphere;
  }

  triangleIndices: Uint32Array;

  geometry: THREE.BufferGeometry;

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
