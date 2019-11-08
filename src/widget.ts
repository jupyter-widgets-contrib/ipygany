// Copyright (c) Martin Renou
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel, DOMWidgetView, ISerializers, unpack_models
} from '@jupyter-widgets/base';

import {
  MODULE_NAME, MODULE_VERSION
} from './version';

// Import the CSS
import '../css/odysis.css'

import {
  Scene
} from './core/Scene';


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
class SceneModel extends _OdysisDOMWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: SceneModel.model_name,
      _view_name: SceneModel.view_name,
      meshes: []
    };
  }

  static serializers: ISerializers = {
      ...DOMWidgetModel.serializers,
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
  }

  scene: Scene;
}
