import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  Effect, Input, InputDimension
} from '../EffectBlock';

import {
  Block
} from '../Block';

import {
  Component
} from '../Data';

import {
  NodeOperation
} from '../NodeMesh';

import {
  IdentityNode
} from '../utils/Nodes';


export
class Alpha extends Effect {

  constructor (parent: Block, input: Input) {
    super(parent, input);

    this.alphaNode = new IdentityNode(this.inputNode);

    this.addAlphaNode(NodeOperation.MUL, this.alphaNode);

    this.buildMaterial();

    this.sortTriangleIndices();

    this.parent.on('change:geometry', this.sortTriangleIndices.bind(this));

    this.initialized = true;
  }

  setInput(input?: Input) : void {
    super.setInput(input);

    if (this.initialized) {
      this.alphaNode.value = this.inputNode;

      this.buildMaterial();
    }
  }

  handleCameraMoveEnd (cameraPosition: THREE.Vector3) {
    super.handleCameraMoveEnd(cameraPosition);

    this.sortTriangleIndices();
  }

  sortTriangleIndices () {
    // TODO: Throttle this call?
    for (const nodeMesh of this.meshes) {
      nodeMesh.sortTriangleIndices(this.lastCameraPosition);
    }
  }

  get inputDimension () : InputDimension {
    return 1;
  }

  private initialized: boolean = false;

  private readonly alphaNode: IdentityNode;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;

}
