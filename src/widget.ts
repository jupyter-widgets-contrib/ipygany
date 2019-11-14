// Copyright (c) Martin Renou
// Distributed under the terms of the Modified BSD License.

import {
  WidgetModel, WidgetView, DOMWidgetModel, DOMWidgetView, ISerializers, ViewList, unpack_models
} from '@jupyter-widgets/base';

import {
  Message
} from '@phosphor/messaging';

import {
  MODULE_NAME, MODULE_VERSION
} from './version';

// Import the CSS
import '../css/odysis.css'

import {
  Scene
} from './core/Scene';

import {
  Data, Component
} from './core/Data';

import {
  Block
} from './core/Block';

import {
  PolyMesh, TetraMesh
} from './core/MeshBlock';

function deserialize_float32array(data: any, manager: any) {
    return new Float32Array(data.data.buffer);
}

function deserialize_uint32array(data: any, manager: any) {
    return new Uint32Array(data.data.buffer);
}


abstract class _OdysisWidgetModel extends WidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_module: _OdysisWidgetModel.model_module,
      _model_module_version: _OdysisWidgetModel.model_module_version,
      _view_module: _OdysisWidgetModel.view_module,
      _view_module_version: _OdysisWidgetModel.view_module_version,
    };
  }

  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}


abstract class _OdysisDOMWidgetModel extends DOMWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_module: _OdysisDOMWidgetModel.model_module,
      _model_module_version: _OdysisDOMWidgetModel.model_module_version,
      _view_module: _OdysisDOMWidgetModel.view_module,
      _view_module_version: _OdysisDOMWidgetModel.view_module_version,
    };
  }

  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}


export
class ComponentModel extends _OdysisWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: ComponentModel.model_name,
      name: '',
      array: []
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.component = new Component(this.get('name'), this.get('array'));

    // this.on('change:array', () => {  });
  }

  component: Component;

  static serializers: ISerializers = {
    ..._OdysisWidgetModel.serializers,
    array: { deserialize: deserialize_float32array },
  }

  static model_name = 'ComponentModel';
}


export
class DataModel extends _OdysisWidgetModel {
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
    ..._OdysisWidgetModel.serializers,
    components: { deserialize: (unpack_models as any) },
  }

  static model_name = 'DataModel';
}


abstract class BlockModel extends _OdysisWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: BlockModel.model_name,
      _view_name: BlockModel.view_name,
      vertices: [],
      data: [],
      default_color: '#6395b0',
    };
  }

  static serializers: ISerializers = {
    ..._OdysisWidgetModel.serializers,
    vertices: { deserialize: deserialize_float32array },
    data: { deserialize: (unpack_models as any) },
  }

  static model_name = 'BlockModel';
  static view_name = 'BlockView';
}


abstract class BlockView extends WidgetView {
  render() {
    this.block = this.createBlock();
    this.block.defaultColor = this.defaultColor;

    this.initEventListeners();
  }

  get vertices () : Float32Array {
    return this.model.get('vertices');
  }

  get data () : DataModel[] {
    return this.model.get('data');
  }

  get defaultColor () : string {
    return this.model.get('default_color');
  }

  initEventListeners() : void {
    this.model.on('change:default_color', () => { this.block.defaultColor = this.defaultColor; });
  }

  abstract createBlock() : Block;

  block: Block;
}


export
class PolyMeshModel extends BlockModel {
  defaults() {
    return {...super.defaults(),
      _model_name: PolyMeshModel.model_name,
      _view_name: PolyMeshModel.view_name,
      triangle_indices: [],
    };
  }

  static serializers: ISerializers = {
    ...BlockModel.serializers,
    triangle_indices: { deserialize: deserialize_uint32array },
  }

  static model_name = 'PolyMeshModel';
  static view_name = 'PolyMeshView';
}


export
class PolyMeshView extends BlockView {
  createBlock () {
    return new PolyMesh(this.vertices, this.triangleIndices, []);
  }

  get triangleIndices () : Uint32Array {
    return this.model.get('triangle_indices');
  }

  initEventListeners () {
    super.initEventListeners();

    this.model.on('change:vertices', () => { this.block.updateVertices(this.vertices); });
  }

  block: PolyMesh;
}


export
class TetraMeshModel extends PolyMeshModel {
  defaults() {
    return {...super.defaults(),
      _model_name: TetraMeshModel.model_name,
      _view_name: TetraMeshModel.view_name,
      tetrahedron_indices: [],
    };
  }

  static serializers: ISerializers = {
    ...PolyMeshModel.serializers,
    tetrahedron_indices: { deserialize: deserialize_uint32array },
  }

  static model_name = 'TetraMeshModel';
  static view_name = 'TetraMeshView';
}


export
class TetraMeshView extends PolyMeshView {
  createBlock () {
    return new TetraMesh(
      this.vertices, this.triangleIndices,
      this.tetrahedronIndices, []
    );
  }

  get tetrahedronIndices () {
    return this.model.get('tetrahedron_indices');
  }

  block: TetraMesh;
}


export
class SceneModel extends _OdysisDOMWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: SceneModel.model_name,
      _view_name: SceneModel.view_name,
      background_color: '#fff',
      children: [],
    };
  }

  static serializers: ISerializers = {
    ..._OdysisDOMWidgetModel.serializers,
    children: { deserialize: (unpack_models as any) },
  }

  static model_name = 'SceneModel';
  static view_name = 'SceneView';
}


export
class SceneView extends DOMWidgetView {
  render() {
    this.el.classList.add('odysis-scene');

    this.scene = new Scene(this.el);

    this.blockViews = new ViewList<BlockView>(this.createBlockView, this.removeBlockView, this);

    this.displayed.then(() => {
      this.scene.initialize();
      this.scene.backgroundColor = this.model.get('background_color');

      this.updateBlocksViews();

      this.initEventListeners();
    });
  }

  initEventListeners () {
    window.addEventListener('resize', this.resize.bind(this), false);

    this.model.on('change:background_color', () => { this.scene.backgroundColor = this.model.get('background_color'); });
    this.model.on('change:children', () => { this.updateBlocksViews(); });
  }

  private updateBlocksViews() {
    this.blockViews.update(this.model.get('children'));
  }

  private createBlockView (blockModel: BlockModel) {
    // The following ts-ignore is needed due to ipywidgets's implementation
    // @ts-ignore
    return this.create_child_view(blockModel).then((blockView: BlockView) => {
      this.scene.addChild(blockView.block);

      return blockView;
    });
  }

  private removeBlockView (blockView: BlockView) {
    // this.scene.removeChild(blockView.block);
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
    this.scene.dispose();

    return super.remove();
  }

  private resize () {
    this.scene.resize();
  }

  scene: Scene;
  blockViews: ViewList<BlockView>;
}
