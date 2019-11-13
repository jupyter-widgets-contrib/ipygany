import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  Effect
} from './Effect';

/**
 * Mesh class
 */
export
abstract class Mesh {

  constructor (data: any) {
    this.data = data;
    // TODO: initialize Buffer Attributes Nodes from data
  }

  /**
   * Add the mesh to a given scene
   */
  abstract addToScene (scene: THREE.Scene) : void;

  abstract set scale (scale: THREE.Vector3);

  data: any;

  effects: Effect[];

}


/**
 * PolyMesh class
 */
export
class PolyMesh extends Mesh {

  constructor (vertices: Float32Array, triangleIndices: Uint32Array, data: any, defaultColor: string) {
    super(data);

    this.vertices = vertices;
    this.triangleIndices = triangleIndices;
    this._defaultColor = defaultColor;

    this.geometry = new THREE.BufferGeometry();
    this.initializeBufferGeometry();

    this.material = new Nodes.StandardNodeMaterial();
    this.material.flatShading = true;
    this.material.side = THREE.DoubleSide;

    // @ts-ignore
    this.material.color = new Nodes.ColorNode(this.defaultColor);

    this.material.build();

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Scale up or down the geometry
    this.geometry.computeBoundingSphere();
    const { radius } = this.geometry.boundingSphere;
    this.mesh.scale.set(1 / radius, 1 / radius, 1 / radius);
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
    this.vertexBuffer.set(vertices);
    this.vertexBuffer.needsUpdate = true;

    this.geometry.center();

    // TODO: Update effects geometries
  }

  set defaultColor (defaultColor: string) {
    this._defaultColor = defaultColor;

    // @ts-ignore
    this.material.color = new Nodes.ColorNode(this.defaultColor);

    this.material.build();
  }

  get defaultColor () : string {
    return this._defaultColor;
  }

  /**
   * Add the mesh to a given scene
   */
  addToScene (scene: THREE.Scene) {
    scene.add(this.mesh);
  }

  set scale(scale: THREE.Vector3) {
    this.mesh.scale = scale;
  }

  vertices: Float32Array;
  triangleIndices: Uint32Array;

  private _defaultColor: string;

  geometry: THREE.BufferGeometry;
  private vertexBuffer: THREE.BufferAttribute;
  private indexBuffer: THREE.BufferAttribute;

  material: Nodes.StandardNodeMaterial;

  private mesh: THREE.Mesh;

}



/**
 * TetraMesh class
 */
export
class TetraMesh extends PolyMesh {

  constructor (vertices: Float32Array, triangleIndices: Uint32Array, tetrahedronIndices: Uint32Array, data: any, defaultColor: string) {
    super(vertices, triangleIndices, data, defaultColor);

    this.tetrahedronIndices = tetrahedronIndices;
  }

  tetrahedronIndices: Uint32Array;

}
