import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  uuid
} from './utils/uuid';

import {
  NodeMesh
} from './NodeMesh';

import {
  Block
} from './Block';

import {
  Data, Component
} from './Data';

import {
  NodeOperation
} from './NodeMesh';

/**
 * Effect InputDimension type, only float, vec2, vec3 and vec4 are supported in shaders.
 */
export
type InputDimension = 0 | 1 | 2 | 3 | 4;

export
type Input = string | ([string, string] | number)[];


/**
 * Effect class
 * This is the base class for all the effects: IsoColor, ClipPlane...
 */
export
class Effect extends Block {

  constructor (parent: Block, input?: Input) {
    super(parent.vertices, parent.data, parent.options);

    this.parent = parent;

    this.triangleIndices = parent.triangleIndices;
    this.tetrahedronIndices = parent.tetrahedronIndices;

    // Copy parent meshes, this does not copy geometries (data buffers are not copied)
    this.meshes = parent.meshes.map((nodeMesh: NodeMesh) => nodeMesh.copy());

    this.setInput(input);

    this.parent.on('change:material', this.buildMaterial.bind(this));
  }

  /**
   * Set the input data, if no arguments are provided a default input will be chosen.
   * The input can be:
   *   - a data name
   *   - a list of (data name, component name) tuples and numbers
   */
  setInput (input?: Input) : void {
    if (this.inputDimension == 0) {
      // Do nothing (Maybe throw?)
      return;
    }

    let inputs: (Component | number)[];

    // Choose a default input if none is provided
    if (input === undefined) {
      if (this.data.length == 0) {
        throw 'No data provided, put this effect needs at least ${this.inputDimension} component(s) as input';
      }

      input = this.data[0].name;
    }

    // If a Data name is given, extract data components
    if (typeof input == 'string') {
      const inputData = this.getData(input);

      if (this.inputDimension > inputData.dimension) {
        inputs = inputData.components.concat(new Array(this.inputDimension - inputData.dimension).fill(0.));
      } else {
        inputs = inputData.components.slice(0, this.inputDimension);
      }
    }
    // List of components is given, verify components length
    else {
      if (input.length != this.inputDimension) {
        throw 'This effect needs ${this.inputDimension} component(s) as input, but ${input} was given';
      }

      inputs = input.map(this.getInput.bind(this));
    }

    // Set the input node
    this.inputs = inputs;

    if (inputs.length == 1) {
      this.inputNode = this.getInputNode(inputs[0]);
    } else {
      // @ts-ignore: The error raise by TypeScript is not relevant here, as the length of inputs is already validated
      this.inputNode = new Nodes.JoinNode(...inputs.map(this.getInputNode.bind(this)));
    }
  }

  /**
   * Add color node to materials
   */
  addColorNode (operation: NodeOperation, colorNode: Nodes.Node) {
    for (const nodeMesh of this.meshes) {
      nodeMesh.addColorNode(operation, colorNode);
    }

    this.buildMaterial();
  }

  /**
   * Add alpha node to materials
   */
  addAlphaNode (operation: NodeOperation, alphaNode: Nodes.Node) {
    for (const nodeMesh of this.meshes) {
      nodeMesh.addAlphaNode(operation, alphaNode);
    }

    this.buildMaterial();
  }

  get inputDimension () : InputDimension {
    return 0;
  }

  /**
   * Get a Data by name
   */
  private getData (name: string) : Data {
    for (const data of this.data) {
       if (data.name == name) {
         return data;
       }
     }

     throw `${name} if not a valid Data name`;
  }

  private getInput (component: [string, string] | number) {
    return typeof component == 'number' ? component : this.getData(component[0]).getComponent(component[1]);
  }

  private getInputNode (component: Component | number) : Nodes.Node {
    return component instanceof Component ? component.node : new Nodes.FloatNode(component);
  }

  parent: Block;

  protected inputs: (Component | number)[] | null = null;
  protected inputNode: Nodes.Node | null = null;

  protected id: string = uuid();

}
