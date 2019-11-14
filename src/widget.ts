// Copyright (c) Martin Renou
// Distributed under the terms of the Modified BSD License.

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
      vertices: [],
      data: [],
      default_color: '#6395b0',
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.block = this.createBlock();
    this.block.defaultColor = this.get('default_color');

    this.initEventListeners();
  }

  initEventListeners() : void {
    this.on('change:default_color', () => { this.block.defaultColor = this.get('default_color'); });
  }

  abstract createBlock() : Block;

  block: Block;

  static serializers: ISerializers = {
    ..._OdysisWidgetModel.serializers,
    vertices: { deserialize: deserialize_float32array },
    data: { deserialize: (unpack_models as any) },
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
    return new PolyMesh(
      this.get('vertices'), this.get('triangle_indices'),
      this.get('data')
    );
  }

  initEventListeners () {
    this.on('change:vertices', () => { this.block.updateVertices(this.get('vertices')); });
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
  defaults() {
    return {...super.defaults(),
      _model_name: TetraMeshModel.model_name,
      tetrahedron_indices: [],
    };
  }

  createBlock () {
    return new TetraMesh(
      this.get('vertices'), this.get('triangle_indices'),
      this.get('tetrahedron_indices'), this.get('data')
    );
  }

  block: TetraMesh;

  static serializers: ISerializers = {
    ...PolyMeshModel.serializers,
    tetrahedron_indices: { deserialize: deserialize_uint32array },
  }

  static model_name = 'TetraMeshModel';
}


export
class SceneModel extends _OdysisDOMWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: SceneModel.model_name,
      _view_name: SceneModel.view_name,
      children: []
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

    this.displayed.then(() => {
      this.scene.initialize();

      const blockModels: BlockModel[] = this.model.get('children');
      for (const blockModel of blockModels) {
        this.scene.addChild(blockModel.block);
      }
    });

    window.addEventListener('resize', this.resize.bind(this), false);
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

  private resize () {
    this.scene.resize();
  }

  scene: Scene;
}
