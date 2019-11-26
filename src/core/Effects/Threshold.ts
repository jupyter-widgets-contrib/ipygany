import * as THREE from 'three';
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
class Threshold extends Effect {

  constructor (parent: Block, input: Input, min: number, max: number) {
    super(parent, input);

    this._min = min;
    this._max = max;

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

    // If there are tetrahedrons, compute new iso-surfaces
    if (this.parent.tetrahedronIndices != null) {
      this.inputComponent = this.inputs[0];

      this.isoSurfaceUtils = new IsoSurfaceUtils(this.parent.vertices, this.parent.tetrahedronIndices);
      this.isoSurfaceUtils.updateInput(this.inputComponent.array, this.parent.data);

      // Create min/max iso-surface geometries
      const [vertices1] = this.isoSurfaceUtils.computeIsoSurface(min);
      const [vertices2] = this.isoSurfaceUtils.computeIsoSurface(max);

      this.geometry1 = new THREE.BufferGeometry();
      this.geometry2 = new THREE.BufferGeometry();

      this.vertexBuffer1 = new THREE.BufferAttribute(vertices1, 3);
      this.vertexBuffer2 = new THREE.BufferAttribute(vertices2, 3);

      this.geometry1.setAttribute('position', this.vertexBuffer1);
      this.geometry2.setAttribute('position', this.vertexBuffer2);

      this.mesh1 = new NodeMesh(THREE.Mesh, this.geometry1);
      this.mesh2 = new NodeMesh(THREE.Mesh, this.geometry2);

      this.mesh1.sortTriangleIndices(this.lastCameraPosition);
      this.mesh2.sortTriangleIndices(this.lastCameraPosition);

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

        this.isoSurfaceUtils.updateInput(this.inputComponent.array, this.parent.data);

        this.updateGeometry1();
        this.updateGeometry2();
      }

      this.buildMaterial();
    }
  }

  onInputArrayChange () {
    this.isoSurfaceUtils.updateInput(this.inputComponent.array, this.parent.data);

    this.updateGeometry1();
    this.updateGeometry2();
  }

  updateGeometry1 () {
    const [vertices1] = this.isoSurfaceUtils.computeIsoSurface(this.min);

    // Not using this.vertexBuffer.set because the number of vertices can change
    this.geometry1.dispose();
    this.vertexBuffer1 = new THREE.BufferAttribute(vertices1, 3);
    this.geometry1.setAttribute('position', this.vertexBuffer1);
    // @ts-ignore
    this.geometry1.index = null;
    this.mesh1.sortTriangleIndices(this.lastCameraPosition);
  }

  updateGeometry2 () {
    const [vertices2] = this.isoSurfaceUtils.computeIsoSurface(this.max);

    // Not using this.vertexBuffer.set because the number of vertices can change
    this.geometry2.dispose();
    this.vertexBuffer2 = new THREE.BufferAttribute(vertices2, 3);
    this.geometry2.setAttribute('position', this.vertexBuffer2);
    // @ts-ignore
    this.geometry2.index = null;
    this.mesh2.sortTriangleIndices(this.lastCameraPosition);
  }

  set min (value: number) {
    this._min = value;

    this.minNode.value = value;
  }

  get min () {
    return this._min;
  }

  set max (value: number) {
    this._max = value;

    this.maxNode.value = value;
  }

  get max () {
    return this._max;
  }

  get inputDimension () : InputDimension {
    return 1;
  }

  private initialized: boolean = false;

  private _min: number;
  private _max: number;

  private minNode: Nodes.FloatNode;
  private maxNode: Nodes.FloatNode;

  private isUnderMax: Nodes.MathNode;
  private isOverMin: Nodes.MathNode;

  private thresholdAlpha: Nodes.OperatorNode;

  private isoSurfaceUtils: IsoSurfaceUtils;

  private vertexBuffer1: THREE.BufferAttribute;
  private vertexBuffer2: THREE.BufferAttribute;
  private geometry1: THREE.BufferGeometry;
  private geometry2: THREE.BufferGeometry;
  private mesh1: NodeMesh;
  private mesh2: NodeMesh;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;
  private inputComponent: Component;

}
