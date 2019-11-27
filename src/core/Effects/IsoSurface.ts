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
  NodeMesh
} from '../NodeMesh';

import {
  IsoSurfaceUtils
} from '../utils/IsoSurfaceUtils';


export
class IsoSurface extends Effect {

  constructor (parent: Block, input: Input, value: number) {
    super(parent, input);

    if (this.parent.tetrahedronIndices == null) {
      throw 'Cannot compute IsoSurface on a Mesh that is not tetrahedron-based';
    }

    this._value = value;
    this.inputComponent = this.inputs[0];

    this.isoSurfaceUtils = new IsoSurfaceUtils(this.parent.vertices, this.parent.tetrahedronIndices);
    this.isoSurfaceUtils.updateInput(this.inputComponent.array, this.parent.data);

    // Remove meshes, only the iso-surface will stay
    this.meshes = [];

    [this.vertices, this.triangleIndices] = this.isoSurfaceUtils.computeIsoSurface(this.value);

    this.geometry = new THREE.BufferGeometry();

    this.vertexBuffer = new THREE.BufferAttribute(this.vertices, 3);
    this.geometry.setAttribute('position', this.vertexBuffer);

    this.mesh = new NodeMesh(THREE.Mesh, this.geometry);
    this.meshes.push(this.mesh);

    this.buildMaterial();

    this.inputComponent.on('change:array', this.onInputArrayChange.bind(this));

    this.initialized = true;
  }

  updateGeometry () {
    [this.vertices, this.triangleIndices] = this.isoSurfaceUtils.computeIsoSurface(this.value);

    // Not using this.vertexBuffer.set because the number of vertices can change
    this.geometry.dispose();
    this.vertexBuffer = new THREE.BufferAttribute(this.vertices, 3);
    this.geometry.setAttribute('position', this.vertexBuffer);

    this.trigger('change:geometry');
  }

  setInput(input?: Input) : void {
    super.setInput(input);

    if (this.initialized) {
      this.inputComponent.off('change:array', this.onInputArrayChange.bind(this));

      this.inputComponent = this.inputs[0];
      this.inputComponent.on('change:array', this.onInputArrayChange.bind(this));

      this.isoSurfaceUtils.updateInput(this.inputComponent.array, this.parent.data);

      this.updateGeometry();
    }
  }

  onInputArrayChange () {
    this.isoSurfaceUtils.updateInput(this.inputComponent.array, this.parent.data);

    this.updateGeometry();
  }

  set value (value: number) {
    this._value = value;
    this.updateGeometry();
  }

  get value () {
    return this._value;
  }

  get inputDimension () : InputDimension {
    return 1;
  }

  tetrahedronIndices: null = null;

  private isoSurfaceUtils: IsoSurfaceUtils;

  private vertexBuffer: THREE.BufferAttribute;
  private geometry: THREE.BufferGeometry;
  private mesh: NodeMesh;

  private _value: number;

  private initialized: boolean = false;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;
  private inputComponent: Component;

}
