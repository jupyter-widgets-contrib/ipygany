import * as THREE from 'three';

import {
  NodeMesh
} from './NodeMesh';

import {
  Data
} from './Data';

/**
 * Base class for all the Mesh and Effect classes
 */
export
abstract class Block {

  constructor (vertices: Float32Array, data: Data[]) {
    this.vertices = vertices;
    this.data = data;
  }

  /**
   * Update vertices buffers
   */
  updateVertices (vertices: Float32Array) {
    // TODO: Trigger event so that children can update their geometries?
  }

  /**
   * Add the mesh to a given scene
   */
  addToScene (scene: THREE.Scene) {
    for (const nodeMesh of this.meshes) {
      scene.add(nodeMesh.mesh);
    }
  }

  /**
   * Compile shaders
   */
  buildMaterials () {
    for (const nodeMesh of this.meshes) {
      nodeMesh.buildMaterial();
    }
  }

  set scale (scale: THREE.Vector3) {
    for (const nodeMesh of this.meshes) {
      nodeMesh.scale = scale;
    }
  }

  set defaultColor (defaultColor: string) {
    for (const nodeMesh of this.meshes) {
      nodeMesh.defaultColor = defaultColor;
    }
  }

  get hasTriangles () {
    return this.triangleIndices != null;
  }

  get hasTetrahedrons () {
    return this.tetrahedronIndices != null;
  }

  vertices: Float32Array;
  data: Data[];

  triangleIndices: null | Uint32Array;
  tetrahedronIndices: null | Uint32Array;

  meshes: NodeMesh[] = [];

}
