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


export
interface BlockOptions {

  position?: THREE.Vector3;
  scale?: THREE.Vector3;

  environmentMeshes?: THREE.Mesh[];

}


/**
 * Base class for all the Mesh and Effect classes
 */
export
abstract class Block extends Events {

  /**
   * Block constructor. This takes the vertices and data as input, and some options.
   */
  constructor (vertices: Float32Array, data: Data[], options?: BlockOptions) {
    super();

    this._vertices = vertices;
    this._data = data;

    if (options) {
      this._environmentMeshes = options.environmentMeshes || this._environmentMeshes;

      this._position = options.position || this._position;
      this._scale = options.scale || this._scale;
    }

    for (const mesh of this._environmentMeshes) {
      mesh.matrixAutoUpdate = false;
    }

    this.updateMatrix();

  }

  /**
   * Set vertices buffers
   */
  set vertices (vertices: Float32Array) {
    this._vertices = vertices;

    this.handleVerticesChange();
  }

  /**
   * Get vertices buffer
   */
  get vertices () {
    return this._vertices;
  }

  /**
   * Get data list
   */
  get data () {
    return this._data;
  }

  /**
   * Add the mesh to a given scene
   */
  addToScene (scene: THREE.Scene) {
    for (const nodeMesh of this.meshes) {
      scene.add(nodeMesh.mesh);
    }

    for (const mesh of this._environmentMeshes) {
      scene.add(mesh);
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

  set position (position: THREE.Vector3) {
    this._position.copy(position);

    this.updateMatrix();
  }

  set scale (scale: THREE.Vector3) {
    this._scale.copy(scale);

    this.updateMatrix();
  }

  private updateMatrix () {
    const scaleMatrix = new THREE.Matrix4().makeScale(this._scale.x, this._scale.y, this._scale.z);
    const positionMatrix = new THREE.Matrix4().makeTranslation(this._position.x, this._position.y, this._position.z);

    const matrix = new THREE.Matrix4().multiplyMatrices(scaleMatrix, positionMatrix);

    for (const nodeMesh of this.meshes) {
      nodeMesh.matrix = matrix;
    }

    matrix.identity();

    for (const mesh of this._environmentMeshes) {
      const meshPositionMatrix = new THREE.Matrix4().makeTranslation(
        mesh.position.x + this._position.x,
        mesh.position.y + this._position.y,
        mesh.position.z + this._position.z
      );

      matrix.multiplyMatrices(scaleMatrix, meshPositionMatrix);
      mesh.matrix.copy(matrix);
      matrix.identity();
    }
  }

  get options () {
    return {environmentMeshes: this._environmentMeshes, position: this._position, scale: this._scale};
  }

  get boundingSphere () : THREE.Sphere {
    let block: Block = this;
    while (block.parent != null) {
      block = block.parent;
    }

    return block.boundingSphere;
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

  handleVerticesChange () {
    this.trigger('change:vertices');
  }

  dispose () {
    for (const nodeMesh of this.meshes) {
      nodeMesh.dispose();
    }
  }

  private _vertices: Float32Array;
  private _data: Data[];

  triangleIndices: null | Uint32Array = null;
  tetrahedronIndices: null | Uint32Array = null;

  meshes: NodeMesh[] = [];
  _environmentMeshes: THREE.Mesh[] = [];

  _position: THREE.Vector3 = new THREE.Vector3(0., 0., 0.);
  _scale: THREE.Vector3 = new THREE.Vector3(1., 1., 1.);

  parent: Block | null = null;

}
