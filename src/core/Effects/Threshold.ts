import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  Effect, InputDimension
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


export
class Threshold extends Effect {

  constructor (parent: Block, input: string | [string, string], min: number, max: number) {
    super(parent, typeof input == 'string' ? input : [input]);

    // Create min and max float nodes
    this.minNode = new Nodes.FloatNode(min);
    this.maxNode = new Nodes.FloatNode(max);

    // GLSL's STEP function is more optimized than an if statement
    // Returns 1 if input < max, 0 otherwise
    this.isUnderMax = new Nodes.MathNode(this.inputNode, this.maxNode, Nodes.MathNode.STEP);

    // Returns 1 if input > min, 0 otherwise
    this.isOverMin = new Nodes.MathNode(this.minNode, this.inputNode, Nodes.MathNode.STEP);

    this.thresholdAlpha = new Nodes.OperatorNode(this.isUnderMax, this.isOverMin, Nodes.OperatorNode.MUL);

    this.addAlphaNode(NodeOperation.MUL, this.thresholdAlpha);

    this.buildMaterials();
  }

  set min (value: number) {
    this.minNode.value = value;
  }

  get min () {
    return this.minNode.value;
  }

  set max (value: number) {
    this.maxNode.value = value;
  }

  get max () {
    return this.maxNode.value;
  }

  get inputDimension () : InputDimension {
    return 1;
  }

  private minNode: Nodes.FloatNode;
  private maxNode: Nodes.FloatNode;

  private isUnderMax: Nodes.MathNode;
  private isOverMin: Nodes.MathNode;

  private thresholdAlpha: Nodes.OperatorNode;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;

}
