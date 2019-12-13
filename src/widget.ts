// Copyright (c) Martin Renou
// Distributed under the terms of the Modified BSD License.

import * as THREE from 'three';

import {
  WidgetModel, DOMWidgetModel, DOMWidgetView, ISerializers, unpack_models
} from '@jupyter-widgets/base';

import {
  Message
} from '@phosphor/messaging';

import {
  MODULE_NAME, MODULE_VERSION
} from './version';

// Import the CSS
import '../css/gany.css'

import {
  Scene, Renderer,
  Data, Component,
  Block, Effect,
  PolyMesh, TetraMesh, PointCloud,
  Warp, Alpha, IsoColor, IsoSurface, Threshold
} from 'ganyjs';


function deserialize_float32array (data: any, manager: any) {
    return new Float32Array(data.data.buffer);
}

function deserialize_uint32array (data: any, manager: any) {
    return new Uint32Array(data.data.buffer);
}

function deserialize_component_array (value: any, manager: any) {
  if (typeof value == 'string') {
    return unpack_models(value, manager);
  } else {
    return deserialize_float32array(value, manager);
  }
}


abstract class _GanyWidgetModel extends WidgetModel {

  defaults () {
    return {...super.defaults(),
      _model_module: _GanyWidgetModel.model_module,
      _model_module_version: _GanyWidgetModel.model_module_version,
    };
  }

  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;

}


abstract class _GanyDOMWidgetModel extends DOMWidgetModel {

  defaults () {
    return {...super.defaults(),
      _model_module: _GanyDOMWidgetModel.model_module,
      _model_module_version: _GanyDOMWidgetModel.model_module_version,
      _view_module: _GanyDOMWidgetModel.view_module,
      _view_module_version: _GanyDOMWidgetModel.view_module_version,
    };
  }

  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;

}


export
class ComponentModel extends _GanyWidgetModel {

  defaults () {
    return {...super.defaults(),
      _model_name: ComponentModel.model_name,
      name: '',
      array: []
    };
  }

  get array () {
    const array = this.get('array');

    if (array.hasOwnProperty('name') && array.name == 'NDArrayModel') {
      return array.getNDArray().data;
    } else {
      return array;
    }
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.component = new Component(this.get('name'), this.array);

    this.on('change:array', () => { this.component.array = this.array; });
  }

  component: Component;

  static serializers: ISerializers = {
    ..._GanyWidgetModel.serializers,
    array: { deserialize: deserialize_component_array },
  }

  static model_name = 'ComponentModel';

}


export
class DataModel extends _GanyWidgetModel {

  defaults() {
    return {...super.defaults(),
      _model_name: DataModel.model_name,
      name: '',
      components: []
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    const components: Component[] = this.get('components').map((componentModel: ComponentModel) => {
      return componentModel.component;
    });

    this.data = new Data(this.get('name'), components);
  }

  data: Data;

  static serializers: ISerializers = {
    ..._GanyWidgetModel.serializers,
    components: { deserialize: (unpack_models as any) },
  }

  static model_name = 'DataModel';

}


abstract class BlockModel extends _GanyWidgetModel {

  defaults() {
    return {...super.defaults(),
      _model_name: BlockModel.model_name,
      vertices: [],
      data: [],
      environment_meshes: [],
      default_color: '#6395b0',
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.block = this.createBlock();
    this.block.defaultColor = this.defaultColor;

    this.initEventListeners();
  }

  get vertices () : Float32Array {
    return this.get('vertices');
  }

  get data () : Data[] {
    return this.get('data').map((dataModel: DataModel) => dataModel.data);;
  }

  get environmentMeshes () : THREE.Mesh[] {
    return this.get('environment_meshes').map((model: any) => model.obj);
  }

  get defaultColor () : string {
    return this.get('default_color');
  }

  initEventListeners() : void {
    this.on('change:default_color', () => { this.block.defaultColor = this.defaultColor; });
  }

  block: Block;

  abstract createBlock() : Block;

  static serializers: ISerializers = {
    ..._GanyWidgetModel.serializers,
    vertices: { deserialize: deserialize_float32array },
    data: { deserialize: (unpack_models as any) },
    environment_meshes: { deserialize: (unpack_models as any) },
  }

  static model_name = 'BlockModel';

}


export
class PolyMeshModel extends BlockModel {

  defaults() {
    return {...super.defaults(),
      _model_name: PolyMeshModel.model_name,
      triangle_indices: [],
    };
  }

  createBlock () {
    return new PolyMesh(this.vertices, this.triangleIndices, this.data, {environmentMeshes: this.environmentMeshes});
  }

  get triangleIndices () : Uint32Array {
    return this.get('triangle_indices');
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:vertices', () => { this.block.vertices = this.vertices; });
    this.on('change:triangle_indices', () => { this.block.triangleIndices = this.triangleIndices; });
  }

  block: PolyMesh;

  static serializers: ISerializers = {
    ...BlockModel.serializers,
    triangle_indices: { deserialize: deserialize_uint32array },
  }

  static model_name = 'PolyMeshModel';

}


export
class TetraMeshModel extends PolyMeshModel {

  defaults () {
    return {...super.defaults(),
      _model_name: TetraMeshModel.model_name,
      tetrahedron_indices: [],
    };
  }

  createBlock () {
    return new TetraMesh(
      this.vertices, this.triangleIndices,
      this.tetrahedronIndices, this.data, {environmentMeshes: this.environmentMeshes}
    );
  }

  get tetrahedronIndices () {
    return this.get('tetrahedron_indices');
  }

  block: TetraMesh;

  static serializers: ISerializers = {
    ...PolyMeshModel.serializers,
    tetrahedron_indices: { deserialize: deserialize_uint32array },
  }

  static model_name = 'TetraMeshModel';

}


export
class PointCloudModel extends BlockModel {

  defaults() {
    return {...super.defaults(),
      _model_name: PointCloudModel.model_name,
    };
  }

  createBlock () {
    return new PointCloud(this.vertices, this.data, {environmentMeshes: this.environmentMeshes});
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:vertices', () => { this.block.vertices = this.vertices; });
  }

  block: PointCloud;

  static model_name = 'PointCloudModel';

}


abstract class EffectModel extends BlockModel {

  defaults() {
    return {...super.defaults(),
      _model_name: EffectModel.model_name,
      parent: null,
      input: null,
    };
  }

  get parent () : BlockModel {
    return this.get('parent');
  }

  get input () {
    return this.get('input');
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:input', this.updateInput.bind(this));
  }

  updateInput () {
    if (this.block.inputDimension != 0) {
      this.block.setInput(this.input);
    }
  }

  block: Effect;

  static serializers: ISerializers = {
    ...BlockModel.serializers,
    parent: { deserialize: (unpack_models as any) },
  }

  static model_name = 'EffectModel';

}


export
class WarpModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: WarpModel.model_name,
    };
  }

  get input () {
    return this.get('input');
  }

  get offset () : THREE.Vector3 {
    const offset = this.get('offset');

    if (typeof offset == 'number') {
      return new THREE.Vector3(offset, offset, offset);
    } else {
      return new THREE.Vector3(offset[0], offset[1], offset[2]);
    }
  }

  get factor () {
    const factor = this.get('factor');

    if (typeof factor == 'number') {
      return new THREE.Vector3(factor, factor, factor);
    } else {
      return new THREE.Vector3(factor[0], factor[1], factor[2]);;
    }
  }

  createBlock () {
    return new Warp(this.parent.block, this.input, this.factor, this.offset);
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:factor', () => { this.block.factor = this.factor; });
    this.on('change:offset', () => { this.block.offset = this.offset; });
  }

  block: Warp;

  static model_name = 'WarpModel';

}


export
class AlphaModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: AlphaModel.model_name,
    };
  }

  get input () {
    const input = this.get('input');

    return typeof input == 'string' ? input : [input];
  }

  createBlock () {
    return new Alpha(this.parent.block, this.input);
  }

  block: Alpha;

  static model_name = 'AlphaModel';

}


export
class IsoColorModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: IsoColorModel.model_name,
      min: 0.,
      max: 0.,
    };
  }

  get min () {
    return this.get('min');
  }

  get max () {
    return this.get('max');
  }

  get input () {
    const input = this.get('input');

    return typeof input == 'string' ? input : [input];
  }

  createBlock () {
    return new IsoColor(this.parent.block, this.input, this.min, this.max);
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:min', () => { this.block.min = this.min; });
    this.on('change:max', () => { this.block.max = this.max; });
  }

  block: IsoColor;

  static model_name = 'IsoColorModel';

}


export
class IsoSurfaceModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: IsoSurfaceModel.model_name,
      value: 0.,
      dynamic: false,
    };
  }

  get value () {
    return this.get('value');
  }

  get dynamic () {
    return this.get('dynamic');
  }

  get input () {
    const input = this.get('input');

    return typeof input == 'string' ? input : [input];
  }

  createBlock () {
    return new IsoSurface(this.parent.block, this.input, {value: this.value, dynamic: this.dynamic});
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:value', () => { this.block.value = this.value });
  }

  block: IsoSurface;

  static model_name = 'IsoSurfaceModel';

}


export
class ThresholdModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: ThresholdModel.model_name,
      min: 0.,
      max: 0.,
      dynamic: false,
    };
  }

  get min () {
    return this.get('min');
  }

  get max () {
    return this.get('max');
  }

  get dynamic () {
    return this.get('dynamic');
  }

  get input () {
    const input = this.get('input');

    return typeof input == 'string' ? input : [input];
  }

  createBlock () {
    return new Threshold(this.parent.block, this.input, {min: this.min, max: this.max, dynamic: this.dynamic});
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:min', () => { this.block.min = this.min });
    this.on('change:max', () => { this.block.max = this.max });
  }

  block: Threshold;

  static model_name = 'ThresholdModel';

}


export
class SceneModel extends _GanyDOMWidgetModel {

  defaults() {
    return {...super.defaults(),
      _model_name: SceneModel.model_name,
      _view_name: SceneModel.view_name,
      background_color: '#fff',
      background_opacity: 0.,
      children: [],
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.scene = new Scene();

    this.updateChildren();
    this.on('change:children', this.updateChildren.bind(this));
  }

  get backgroundColor () : string {
    return this.get('background_color')
  }

  get backgroundOpacity () : number {
    return this.get('background_opacity')
  }

  private updateChildren () {
    // TODO: Remove old children

    const blocks: Block[] = this.get('children').map((child: BlockModel) => child.block);

    if (blocks.length == 0) {
      return;
    }

    const boundingSphereRadius = Math.max(...blocks.map((block: Block) => block.boundingSphere.radius));
    const scale = new THREE.Vector3(1 / boundingSphereRadius, 1 / boundingSphereRadius, 1 / boundingSphereRadius);

    const position = blocks[0].boundingSphere.center;

    for (const block of blocks) {
      block.scale = scale;
      block.position = new THREE.Vector3(-position.x, -position.y, -position.z);

      this.scene.addChild(block);
    }
  }

  scene: Scene;

  static serializers: ISerializers = {
    ..._GanyDOMWidgetModel.serializers,
    children: { deserialize: (unpack_models as any) },
  }

  static model_name = 'SceneModel';
  static view_name = 'SceneView';

}


export
class SceneView extends DOMWidgetView {

  render () {
    this.el.classList.add('gany-scene');

    this.renderer = new Renderer(this.el, this.model.scene);

    this.displayed.then(() => {
      this.renderer.initialize();
      this.renderer.backgroundColor = this.model.backgroundColor
      this.renderer.backgroundOpacity = this.model.backgroundOpacity;

      this.initEventListeners();
    });
  }

  initEventListeners () {
    window.addEventListener('resize', this.resize.bind(this), false);

    this.model.on('change:background_color', () => { this.renderer.backgroundColor = this.model.backgroundColor; });
    this.model.on('change:background_opacity', () => { this.renderer.backgroundOpacity = this.model.backgroundOpacity; });
  }

  processPhosphorMessage (msg: Message) {
    super.processPhosphorMessage(msg);

    switch (msg.type) {
      case 'resize':
      case 'after-show':
        this.resize();
        break;
    }
  }

  remove () {
    this.renderer.dispose();

    return super.remove();
  }

  private resize () {
    this.renderer.resize();
  }

  renderer: Renderer;

  model: SceneModel;

}
