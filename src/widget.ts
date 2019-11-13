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
  Mesh, PolyMesh, TetraMesh
} from './core/Mesh';

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


abstract class MeshModel extends _OdysisWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: MeshModel.model_name,
      data: [],
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.mesh = this.createMesh();
    this.initEventListeners();
  }

  abstract createMesh() : Mesh;
  abstract initEventListeners() : void;

  mesh: Mesh;

  static serializers: ISerializers = {
    ..._OdysisWidgetModel.serializers,
    data: { deserialize: (unpack_models as any) },
  }

  static model_name = 'MeshModel';
}


export
class PolyMeshModel extends MeshModel {
  defaults() {
    return {...super.defaults(),
      _model_name: PolyMeshModel.model_name,
      vertices: [],
      triangle_indices: [],
      default_color: '#6395b0',
    };
  }

  createMesh () {
    return new PolyMesh(
      this.get('vertices'), this.get('triangle_indices'),
      this.get('data'), this.get('default_color')
    );
  }

  initEventListeners () {
    this.on('change:vertices', () => { this.mesh.updateVertices(this.get('vertices')); });
    this.on('change:default_color', () => { this.mesh.defaultColor = this.get('default_color'); });
  }

  mesh: PolyMesh;

  static serializers: ISerializers = {
    ...MeshModel.serializers,
    vertices: { deserialize: deserialize_float32array },
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

  createMesh () {
    return new TetraMesh(
      this.get('vertices'), this.get('triangle_indices'),
      this.get('tetrahedron_indices'), this.get('data'),
      this.get('default_color')
    );
  }

  mesh: TetraMesh;

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
      meshes: []
    };
  }

  static serializers: ISerializers = {
    ..._OdysisDOMWidgetModel.serializers,
    meshes: { deserialize: (unpack_models as any) },
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

      const meshModels: MeshModel[] = this.model.get('meshes');
      for (const meshModel of meshModels) {
        this.scene.addMesh(meshModel.mesh);
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
