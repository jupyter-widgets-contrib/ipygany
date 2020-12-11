// Copyright (c) Martin Renou
// Distributed under the terms of the Modified BSD License.

import * as THREE from 'three';

import {
  WidgetModel, DOMWidgetModel, DOMWidgetView, ISerializers, unpack_models
} from '@jupyter-widgets/base';

import {
  ImageView
} from '@jupyter-widgets/controls';

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
  Warp, WarpByScalar, Alpha, RGB, IsoColor, IsoSurface, Threshold,
  Water, UnderWater,
} from 'ganyjs';


function deserialize_float32array (data: any, manager: any) {
    return new Float32Array(data.data.buffer);
}

function deserialize_uint32array (data: any, manager: any) {
    return new Uint32Array(data.data.buffer);
}

function deserialize_data_array (value: any, manager: any) {
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
      return new Float32Array(array.getNDArray().data);
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
    array: { deserialize: deserialize_data_array },
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

  get vertices () {
    const array = this.get('vertices');

    if (array.hasOwnProperty('name') && array.name == 'NDArrayModel') {
      return new Float32Array(array.getNDArray().data);
    } else {
      return array;
    }
  }

  get data () : Data[] {
    return this.get('data').map((dataModel: DataModel) => dataModel.data);;
  }

  get environmentMeshes () : THREE.Mesh[] {
    return this.get('environment_meshes').map((model: any) => model.obj);
  }

  get defaultColor () : THREE.Color {
    return new THREE.Color(this.get('default_color'));
  }

  initEventListeners() : void {
    this.on('change:default_color', () => { this.block.defaultColor = this.defaultColor; });
  }

  block: Block;

  abstract createBlock() : Block;

  static serializers: ISerializers = {
    ..._GanyWidgetModel.serializers,
    vertices: { deserialize: deserialize_data_array },
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
class WarpByScalarModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: WarpByScalarModel.model_name,
    };
  }

  get input () {
    return this.get('input');
  }

  get factor () {
    return this.get('factor');
  }

  createBlock () {
    return new WarpByScalar(this.parent.block, this.input, this.factor);
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:factor', () => { this.block.factor = this.factor; });
  }

  block: WarpByScalar;

  static model_name = 'WarpByScalarModel';

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
class RGBModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: RGBModel.model_name,
    };
  }

  get input () {
    return this.get('input');
  }

  createBlock () {
    return new RGB(this.parent.block, this.input);
  }

  block: RGB;

  static model_name = 'RGBModel';

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
      range: [0., 0.],
      dynamic: false,
      inclusive: true,
    };
  }

  get min () {
    return this.get('min');
  }

  set min (value: number) {
    this.set('min', value)
  }

  get max () {
    return this.get('max');
  }

  set max (value: number) {
    this.set('max', value)
  }

  get range () {
    return this.get('range');
  }

  set range (value: [number, number]) {
    this.set('range', value)
  }

  get dynamic () {
    return this.get('dynamic');
  }

  get inclusive (): boolean {
    return this.get('inclusive');
  }

  get input () {
    const input = this.get('input');

    return typeof input == 'string' ? input : [input];
  }

  createBlock () {
    return new Threshold(this.parent.block, this.input, {
      min: this.min, max: this.max,
      dynamic: this.dynamic, inclusive: this.inclusive
    });
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:min', () => {
      this.block.min = this.min;
      this.range = [this.min, this.max];
    });
    this.on('change:max', () => {
      this.block.max = this.max;
      this.range = [this.min, this.max];
    });
    this.on('change:range', () => {
      this.min = this.range[0];
      this.max = this.range[1];
    });
    this.on('change:inclusive', () => { this.block.inclusive = this.inclusive });
  }

  block: Threshold;

  static model_name = 'ThresholdModel';

}


export
class UnderWaterModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: UnderWaterModel.model_name,
      default_color: '#F2FFD2',
      texture: null,
      texture_scale: 2.,
      texture_position: [1., 1., 0.],
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.setTexture();
  }

  get input () {
    const input = this.get('input');

    return typeof input == 'string' ? input : [input];
  }

  get textureScale () {
    return this.get('texture_scale');
  }

  get texturePosition (): THREE.Vector3 {
    const texturePosition = this.get('texture_position');
    return new THREE.Vector3(texturePosition[0], texturePosition[1], texturePosition[2]);
  }

  setTexture () {
    const image = this.get('texture');

    if (image === null) {
      this.block.texture = null;

      return;
    }

    this.widget_manager.create_view(image, {}).then((imageView: ImageView) => {
      const textureLoader = new THREE.TextureLoader();

      textureLoader.load(imageView.el.src, (texture: THREE.Texture) => {
        this.block.texture = texture;
      });
    });
  }

  createBlock () {
    return new UnderWater(this.parent.block, this.input, { defaultColor: this.defaultColor, textureScale: this.textureScale, texturePosition: this.texturePosition });
  }

  initEventListeners() : void {
    super.initEventListeners();

    this.on('change:texture', () => {
      this.setTexture();
    });
    this.on('change:texture_scale', () => {
      this.block.textureScale = this.textureScale;
    });
    this.on('change:texture_position', () => {
      this.block.texturePosition = this.texturePosition;
    });
  }

  block: UnderWater;

  static model_name = 'UnderWaterModel';

  static serializers: ISerializers = {
    ...EffectModel.serializers,
    texture: { deserialize: (unpack_models as any) },
  }

}


export
class WaterModel extends EffectModel {

  defaults() {
    return {...super.defaults(),
      _model_name: WaterModel.model_name,
      under_water_blocks: [],
      caustics_enabled: false,
      caustics_factor: 0.2,
    };
  }

  get causticsFactor () : number {
    return this.get('caustics_factor');
  }

  get causticsEnabled () : boolean {
    return this.get('caustics_enabled');
  }

  get underWaterBlocks () : UnderWater[] {
    return this.get('under_water_blocks').map((underWaterBlockWidget: UnderWaterModel) => underWaterBlockWidget.block);
  }

  createBlock () {
    // TODO Add texture to the package
    const url = 'https://raw.githubusercontent.com/martinRenou/threejs-caustics/master/assets/TropicalSunnyDay_';

    return new Water(this.parent.block, {
      underWaterBlocks: this.underWaterBlocks,
      causticsEnabled: this.causticsEnabled,
      causticsFactor: this.causticsFactor,
      skybox: new THREE.CubeTextureLoader().load([
        url + 'px.jpg', url + 'nx.jpg',
        url + 'py.jpg', url + 'ny.jpg',
        url + 'pz.jpg', url + 'nz.jpg',
      ]),
    });
  }

  initEventListeners () : void {
    super.initEventListeners();

    this.on('change:caustics_enabled', () => { this.block.causticsEnabled = this.causticsEnabled });
    this.on('change:caustics_factor', () => { this.block.causticsFactor = this.causticsFactor });
  }

  block: Water;

  static model_name = 'WaterModel';

  static serializers: ISerializers = {
    ...EffectModel.serializers,
    under_water_blocks: { deserialize: (unpack_models as any) },
  }

}


export
class SceneModel extends _GanyDOMWidgetModel {

  defaults() {
    return {...super.defaults(),
      _model_name: SceneModel.model_name,
      _view_name: SceneModel.view_name,
      background_color: 'white',
      background_opacity: 1.,
      children: [],
      camera_position: null,
      camera_up: [0, 1, 0],
      camera_target: null,
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.scene = new Scene();

    this._scale = new THREE.Vector3(1., 1., 1.);
    this._translation = new THREE.Vector3(0., 0., 0.);
    this.updateMatrix();

    this.updateChildren();
    this.on('change:children', this.updateChildren.bind(this));
  }

  get backgroundColor () : string {
    return this.get('background_color')
  }

  get backgroundOpacity () : number {
    return this.get('background_opacity')
  }

  get cameraPosition () : THREE.Vector3 | null {
    const position = this.get('camera_position');

    if (position === null) {
      return null;
    }

    return this.scale(new THREE.Vector3(position[0], position[1], position[2]));
  }

  get cameraUp () : THREE.Vector3 {
    const position = this.get('camera_up');
    return new THREE.Vector3(position[0], position[1], position[2]);
  }

  get cameraTarget () : THREE.Vector3 | null {
    const target = this.get('camera_target');

    if (target === null) {
      return null;
    }

    return this.scale(new THREE.Vector3(target[0], target[1], target[2]));
  }

  private scale (vector: THREE.Vector3) {
    return new THREE.Vector3().copy(vector).applyMatrix4(this._matrix);
  }

  private updateMatrix () {
    const scaleMatrix = new THREE.Matrix4().makeScale(this._scale.x, this._scale.y, this._scale.z);
    const positionMatrix = new THREE.Matrix4().makeTranslation(this._translation.x, this._translation.y, this._translation.z);

    this._matrix = new THREE.Matrix4().multiplyMatrices(scaleMatrix, positionMatrix);
  }

  private updateChildren () {
    // TODO: Remove old children

    const blocks: Block[] = this.get('children').map((child: BlockModel) => child.block);

    if (blocks.length == 0) {
      return;
    }

    const boundingSphereRadius = Math.max(...blocks.map((block: Block) => block.boundingSphere.radius));

    const scale = 1 / boundingSphereRadius;
    this._scale.x = scale;
    this._scale.y = scale;
    this._scale.z = scale;

    const position = blocks[0].boundingSphere.center;

    this._translation = new THREE.Vector3(-position.x, -position.y, -position.z);

    this.updateMatrix();

    for (const block of blocks) {
      block.scale = this._scale;
      block.position = this._translation;

      this.scene.addBlock(block);
    }
  }

  scene: Scene;

  private _scale: THREE.Vector3;
  private _translation: THREE.Vector3;
  private _matrix: THREE.Matrix4;

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

      this.updateCameraUp();
      this.updateCameraPosition();
      this.updateCameraTarget();

      this.initEventListeners();
    });
  }

  initEventListeners () {
    window.addEventListener('resize', this.resize.bind(this), false);

    this.model.on('change:background_color', () => { this.renderer.backgroundColor = this.model.backgroundColor; });
    this.model.on('change:background_opacity', () => { this.renderer.backgroundOpacity = this.model.backgroundOpacity; });

    this.model.on('change:camera_position', this.updateCameraPosition.bind(this));
    this.model.on('change:camera_target', this.updateCameraTarget.bind(this));
    this.model.on('change:camera_up', this.updateCameraUp.bind(this));
  }

  updateCameraPosition () {
    const newPosition = this.model.cameraPosition;

    if (newPosition === null) {
      return;
    }

    this.renderer.cameraPosition = newPosition;
  }

  updateCameraTarget () {
    const newTarget = this.model.cameraTarget;

    if (newTarget === null) {
      return;
    }

    this.renderer.cameraTarget = newTarget;
  }

  updateCameraUp () {
    this.renderer.cameraUp = this.model.cameraUp;
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
