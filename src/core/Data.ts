import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  uuid
} from '@jupyter-widgets/base';


type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;


export
class Component {

  constructor (name: string, array: TypedArray) {
    this.name = name;
    this.array = array;

    this.shaderName = uuid();

    this.bufferAttribute = new THREE.BufferAttribute(this.array, 1);
    this.node = new Nodes.AttributeNode(this.shaderName, 'float');
  }

  /**
   * Add this component to a given geometry
   */
  addToGeometry (geometry: THREE.BufferGeometry) {
    geometry.addAttribute(this.shaderName, this.bufferAttribute);
    // TODO: Remember this geometry so that we can update it when the buffer changes?
  }

  name: string;
  array: TypedArray;

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
   * Add data to a given geometry
   */
  addToGeometry (geometry: THREE.BufferGeometry) {
    for (const component of this.components) {
      component.addToGeometry(geometry);
    }
  }

  components: Component[];
  name: string;

}
