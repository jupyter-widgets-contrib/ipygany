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
  Mesh
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
class MeshModel extends _OdysisWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: MeshModel.model_name,
      vertices: [],
      triangle_indices: [],
      tetrahedron_indices: [],
      data: [],
      default_color: '#6395b0',
    };
  }

  initialize (attributes: any, options: any) {
    super.initialize(attributes, options);

    this.mesh = new Mesh(
      this.get('vertices'), this.get('triangle_indices'),
      this.get('tetrahedron_indices'), this.get('data'),
      this.get('default_color')
    );

    this.on('change:vertices', () => { this.mesh.updateVertices(this.get('vertices')); });
    this.on('change:default_color', () => { this.mesh.defaultColor = this.get('default_color'); });
  }

  mesh: Mesh;

  static serializers: ISerializers = {
    ..._OdysisWidgetModel.serializers,
    vertices: { deserialize: deserialize_float32array },
    triangle_indices: { deserialize: deserialize_uint32array },
    tetrahedron_indices: { deserialize: deserialize_uint32array },
    // data: { deserialize: (unpack_models as any) },
  }

  static model_name = 'MeshModel';
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
