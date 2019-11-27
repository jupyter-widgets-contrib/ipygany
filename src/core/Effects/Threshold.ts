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
  NodeOperation, NodeMesh
} from '../NodeMesh';

import {
  IsoSurfaceUtils
} from '../utils/IsoSurfaceUtils';


export
interface ThresholdOptions {

  min?: number;
  max?: number;

  dynamic?: boolean;

}


export
class Threshold extends Effect {

  constructor (parent: Block, input: Input, options?: ThresholdOptions) {
    super(parent, input);

    if (options) {
      this._min = options.min !== undefined ? options.min : this._min;
      this._max = options.max !== undefined ? options.max : this._max;
      this.dynamic = options.dynamic !== undefined ? options.dynamic : this.dynamic;
    }

    // Create min and max float nodes
    this.minNode = new Nodes.FloatNode(this._min);
    this.maxNode = new Nodes.FloatNode(this._max);

    // GLSL's STEP function is more optimized than an if statement
    // Returns 1 if input < max, 0 otherwise
    this.isUnderMax = new Nodes.MathNode(this.inputNode, this.maxNode, Nodes.MathNode.STEP);

    // Returns 1 if input > min, 0 otherwise
    this.isOverMin = new Nodes.MathNode(this.minNode, this.inputNode, Nodes.MathNode.STEP);

    this.thresholdAlpha = new Nodes.OperatorNode(this.isUnderMax, this.isOverMin, Nodes.OperatorNode.MUL);

    this.addAlphaNode(NodeOperation.MUL, this.thresholdAlpha);

    // If there are tetrahedrons, compute new iso-surfaces
    if (this.parent.tetrahedronIndices != null) {
      this.inputComponent = this.inputs[0];

      this.isoSurfaceUtils1 = new IsoSurfaceUtils(this.parent.vertices, this.parent.tetrahedronIndices, this.data, this.dynamic);
      this.isoSurfaceUtils1.updateInput(this.inputComponent.array);

      this.isoSurfaceUtils2 = new IsoSurfaceUtils(this.parent.vertices, this.parent.tetrahedronIndices, this.data, this.dynamic);
      this.isoSurfaceUtils2.updateInput(this.inputComponent.array);

      // Create min/max iso-surface geometries
      this.isoSurfaceUtils1.computeIsoSurface(this._min);
      this.mesh1 = this.isoSurfaceUtils1.mesh;

      this.isoSurfaceUtils2.computeIsoSurface(this._max);
      this.mesh2 = this.isoSurfaceUtils2.mesh;

      this.mesh1.copyMaterial(this.parent.meshes[0]);
      this.mesh2.copyMaterial(this.parent.meshes[0]);

      this.meshes.push(this.mesh1);
      this.meshes.push(this.mesh2);

      this.inputComponent.on('change:array', this.onInputArrayChange.bind(this));
    }

    this.buildMaterial();

    this.initialized = true;
  }

  setInput(input?: Input) : void {
    super.setInput(input);

    if (this.initialized) {
      this.isUnderMax.a = this.inputNode;
      this.isOverMin.b = this.inputNode;

      if (this.parent.tetrahedronIndices != null) {
        this.inputComponent.off('change:array', this.onInputArrayChange.bind(this));

        this.inputComponent = this.inputs[0];
        this.inputComponent.on('change:array', this.onInputArrayChange.bind(this));

        this.isoSurfaceUtils1.updateInput(this.inputComponent.array);
        this.isoSurfaceUtils2.updateInput(this.inputComponent.array);

        this.updateGeometry1();
        this.updateGeometry2();
      }

      this.buildMaterial();
    }
  }

  onInputArrayChange () {
    this.isoSurfaceUtils1.updateInput(this.inputComponent.array);
    this.isoSurfaceUtils2.updateInput(this.inputComponent.array);

    this.updateGeometry1();
    this.updateGeometry2();
  }

  updateGeometry1 () {
    this.isoSurfaceUtils1.computeIsoSurface(this.min);

    this.trigger('change:geometry');
  }

  updateGeometry2 () {
    this.isoSurfaceUtils2.computeIsoSurface(this.max);

    this.trigger('change:geometry');
  }

  set min (value: number) {
    this._min = value;

    this.minNode.value = value;

    if (this.parent.tetrahedronIndices != null) {
      this.updateGeometry1();
    }
  }

  get min () {
    return this._min;
  }

  set max (value: number) {
    this._max = value;

    this.maxNode.value = value;

    if (this.parent.tetrahedronIndices != null) {
      this.updateGeometry2();
    }
  }

  get max () {
    return this._max;
  }

  get inputDimension () : InputDimension {
    return 1;
  }

  private initialized: boolean = false;

  private _min: number = 0;
  private _max: number = 1;

  private dynamic: boolean = false;

  private minNode: Nodes.FloatNode;
  private maxNode: Nodes.FloatNode;

  private isUnderMax: Nodes.MathNode;
  private isOverMin: Nodes.MathNode;

  private thresholdAlpha: Nodes.OperatorNode;

  private isoSurfaceUtils1: IsoSurfaceUtils;
  private isoSurfaceUtils2: IsoSurfaceUtils;

  private mesh1: NodeMesh;
  private mesh2: NodeMesh;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;
  private inputComponent: Component;

}
