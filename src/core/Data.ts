import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  uuid
} from './utils/uuid';

import {
  TypedArray
} from './utils/types';

import {
  Events
} from './Events';


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
   * Add this component to a given geometry.
   */
  addToGeometry (geometry: THREE.BufferGeometry) {
    if (geometry.getAttribute(this.shaderName) === undefined) {
      geometry.setAttribute(this.shaderName, this.bufferAttribute);
    }
  }

  /**
   * Update the component array.
   */
  set array (array: TypedArray) {
    this._array = array;

    this.bufferAttribute.set(array);
    this.bufferAttribute.needsUpdate = true;

    this.trigger('change:array');
  }

  get array () {
    return this._array;
  }

  /**
   * Returns a copy of this component
   */
  copy () {
    return new Component(this.name, this.array, this.shaderName);
  }

  name: string;
  _array: TypedArray;

  bufferAttribute: THREE.BufferAttribute;
  node: Nodes.AttributeNode;

  private shaderName: string;

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
  copy () {
    const components = this.components.map((component: Component) => component.copy());

    return new Data(this.name, components);
  }

  components: Component[];
  name: string;

}
