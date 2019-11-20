import * as THREE from 'three';

import {
  Events
} from './Events';

import {
  NodeMesh
} from './NodeMesh';

import {
  Data, Component
} from './Data';


/**
 * Base class for all the Mesh and Effect classes
 */
export
abstract class Block extends Events {

  constructor (vertices: Float32Array, data: Data[]) {
    super();

    this.vertices = vertices;
    this.data = data;
  }

  /**
   * Update vertices buffers
   */
  updateVertices (vertices: Float32Array) {
    this.trigger('change:vertices');
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
  buildMaterial () {
    for (const nodeMesh of this.meshes) {
      nodeMesh.buildMaterial();
    }

    this.trigger('change:material');
  }

  /**
   * Add a component to the meshes, so that it can be used in shaders.
   * This will send the entire component buffer to the GPU, so it should be used wisely.
   */
  addComponent (component: Component) {
    for (const nodeMesh of this.meshes) {
      nodeMesh.addComponent(component);
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

  set defaultAlpha (defaultAlpha: number) {
    for (const nodeMesh of this.meshes) {
      nodeMesh.defaultAlpha = defaultAlpha;
    }
  }

  get hasTriangles () {
    return this.triangleIndices != null;
  }

  get hasTetrahedrons () {
    return this.tetrahedronIndices != null;
  }

  dispose () {
    for (const nodeMesh of this.meshes) {
      nodeMesh.dispose();
    }
  }

  vertices: Float32Array;
  data: Data[];

  triangleIndices: null | Uint32Array;
  tetrahedronIndices: null | Uint32Array;

  meshes: NodeMesh[] = [];

}
