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
interface IsoSurfaceOptions {

  value?: number;

  dynamic?: boolean;

}


export
class IsoSurface extends Effect {

  constructor (parent: Block, input: Input, options?: IsoSurfaceOptions) {
    super(parent, input);

    if (this.parent.tetrahedronIndices == null) {
      throw 'Cannot compute IsoSurface on a Mesh that is not tetrahedron-based';
    }

    if (options) {
      this._value = options.value !== undefined ? options.value : this._value;
      this.dynamic = options.dynamic !== undefined ? options.dynamic : this.dynamic;
    }

    // Remove meshes, only the iso-surface will stay
    this.meshes = [];

    this.inputComponent = this.inputs[0];

    this.isoSurfaceUtils = new IsoSurfaceUtils(this.parent.vertices, this.parent.tetrahedronIndices, this.data, this.dynamic);
    this.isoSurfaceUtils.updateInput(this.inputComponent.array);

    this.isoSurfaceUtils.computeIsoSurface(this.value);
    this.mesh = this.isoSurfaceUtils.mesh;
    this.vertices = this.isoSurfaceUtils.vertices;
    this.data = this.mesh.data;

    this.mesh.copyMaterial(this.parent.meshes[0]);

    this.meshes.push(this.mesh);

    this.buildMaterial();

    this.inputComponent.on('change:array', this.onInputArrayChange.bind(this));

    this.initialized = true;
  }

  updateGeometry () {
    this.isoSurfaceUtils.computeIsoSurface(this.value);

    this.vertices = this.isoSurfaceUtils.vertices;

    this.trigger('change:geometry');
  }

  setInput(input?: Input) : void {
    super.setInput(input);

    if (this.initialized) {
      this.inputComponent.off('change:array', this.onInputArrayChange.bind(this));

      this.inputComponent = this.inputs[0];
      this.inputComponent.on('change:array', this.onInputArrayChange.bind(this));

      this.onInputArrayChange();
    }
  }

  onInputArrayChange () {
    this.isoSurfaceUtils.updateInput(this.inputComponent.array);

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

  private mesh: NodeMesh;

  private _value: number = 0;
  private dynamic: boolean = false;

  private initialized: boolean = false;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;
  private inputComponent: Component;

}
