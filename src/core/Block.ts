import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  NodeMesh
} from './NodeMesh';

import {
  Data, Component
} from './Data';

function getInputNode(component: Component | number) {
  return component instanceof Component ? component.node : new Nodes.FloatNode(component);
}

/**
 * Base class for all the Mesh and Effect classes
 */
export
abstract class Block {

  constructor (vertices: Float32Array, data: Data[]) {
    this.vertices = vertices;
    this.data = data;

    this.setInput();
  }

  /**
   * Set the input data, if no arguments are provided a default input will be chosen.
   */
  setInput (components?: (Component | number)[]) : void {
    if (this.inputDimension == 0) {
      // Do nothing (Maybe throw?)
      return;
    }

    let inputs: (Component | number)[];

    // Choose a default input if none is provided
    if (components === undefined) {
      if (this.data.length == 0) {
        throw 'No data provided, put this effect needs at least ${this.inputDimension} component(s) as input';
      }

      const inputData = this.data[0];

      if (this.inputDimension > inputData.dimension) {
        inputs = inputData.components.concat(new Array(this.inputDimension - inputData.dimension).fill(0.));
      } else {
        inputs = inputData.components.slice(0, this.inputDimension);
      }
    } else {
      if (components.length != this.inputDimension) {
        throw 'This effect needs ${this.inputDimension} component(s) as input, but ${components} was given';
      }

      inputs = components;
    }

    // Set the input node
    this.inputs = inputs;

    if (inputs.length == 1) {
      this.inputNode = getInputNode(inputs[0]);
    } else {
      // @ts-ignore: The error raise by TypeScript is not relevant here, as the length of inputs is already validated
      this.inputNode = new Nodes.JoinNode(...inputs.map(getInputNode));
    }
  }

  /**
   * Get a Data by name
   */
  getData (name: string) : Data {
    for (const data of this.data) {
      if (data.name == name) {
        return data;
      }
    }

    throw `${name} if not a valid Data name`;
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

  readonly inputDimension: 0 | 1 | 2 | 3 | 4 = 0;
  protected inputs: (Component | number)[] | null = null;
  protected inputNode: Nodes.Node | null = null;

}
