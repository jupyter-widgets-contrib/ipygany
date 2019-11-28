import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  uuid
} from './utils/uuid';

import {
  TypedArray, Dict
} from './utils/types';

import {
  Events
} from './Events';


export
interface ComponentDict {

  array: number[];
  shaderName: string;

}


export
type DataDict = Dict<Dict<ComponentDict>>;


export
function datalistToDict (datalist: Data[], copyArrays: boolean = true) : DataDict {
  const dict: DataDict = {};

  for (const data of datalist) {
    dict[data.name] = {};

    for (const component of data.components) {
      const array = copyArrays ? Array.from(component.array) : [];

      dict[data.name][component.name] = {array, shaderName: component.shaderName};
    }
  }

  return dict;
}


export
function dictToDatalist (dict: DataDict) : Data[] {
  const list: Data[] = [];

  for (const dataName in dict) {
    const components: Component[] = [];

    for (const componentName in dict[dataName]) {
      const componentDict = dict[dataName][componentName];

      components.push(new Component(componentName, new Float32Array(componentDict.array), componentDict.shaderName));
    }

    list.push(new Data(dataName, components));
  }

  return list;
}


export
function updateDatalistFromDict (datalist: Data[], dict: DataDict) : void {
  for (const data of datalist) {
    for (const component of data.components) {
      component.array = new Float32Array(dict[data.name][component.name].array);
    }
  }
}


export
class Component extends Events {

  constructor (name: string, array: TypedArray, shaderName: string = uuid()) {
    super();

    this.name = name;
    this._array = array;
    this.shaderName = shaderName;

    this.bufferAttribute = new THREE.BufferAttribute(this._array, 1);
    this.node = new Nodes.AttributeNode(this.shaderName, 'float');
  }

  /**
   * Update the component array.
   */
  set array (array: TypedArray) {
    if (this._array.length == array.length) {
      this.bufferAttribute.set(array);
      this.bufferAttribute.needsUpdate = true;
    } else {
      this.bufferAttribute = new THREE.BufferAttribute(array, 1);
    }

    this._array = array;

    this.trigger('change:array');
  }

  get array () {
    return this._array;
  }

  /**
   * Returns a copy of this component
   */
  copy (copyArray: boolean = true) {
    const array = copyArray ? this.array : new Float32Array(0);
    return new Component(this.name, array, this.shaderName);
  }

  name: string;
  _array: TypedArray;

  bufferAttribute: THREE.BufferAttribute;
  node: Nodes.AttributeNode;

  readonly shaderName: string;

}


export
class Data {

  constructor (name: string, components: Component[]) {
    this.name = name;
    this.components = components;
  }

  get dimension () {
    return this.components.length;
  }

  /**
   * Get a data Component by name
   */
  getComponent (name: string) : Component {
    for (const component of this.components) {
      if (component.name == name) {
        return component;
      }
    }

    throw `${name} is not a valid component name for ${this.name}`;
  }

  /**
   * Returns a copy of this data
   */
  copy (copyArray: boolean = true) {
    const components = this.components.map((component: Component) => component.copy(copyArray));

    return new Data(this.name, components);
  }

  components: Component[];
  name: string;

}
