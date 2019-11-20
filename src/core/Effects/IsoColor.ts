import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  Effect, Input, InputDimension
} from '../EffectBlock';

import {
  Block
} from '../Block';

import {
  Component
} from '../Data';

import {
  NodeOperation
} from '../NodeMesh';


export
class IsoColor extends Effect {

  constructor (parent: Block, input: Input, min: number, max: number) {
    super(parent, input);

    const textureLoader = new THREE.TextureLoader();
    this.textureNode = new Nodes.TextureNode(textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAAABCAMAAAD92eD2AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAEsUExURUQCVUUGWUYKXUcNYEcRZEgVZ0gZa0gcbkgfcEgjdEgmdkgpeUcte0cvfUYzf0U2gUQ5g0M8hEI/hUFCh0BFiD9IiT5Lij1OijtRizpTizlWjDhajDZcjTVfjTRhjTJkjjFmjjBpji9sji5uji1xjixyjit1jip4jil6jih9jid/jiaCjiWEjiSGjiOJjiKLjSGOjSGRjCCSjB+Vix+Xix+aih6ciR+fiB+hhyCjhiGmhSOohCWrgietgSmvfy2yfTC0ezS2eTi5dzy7dUC9ckS/cErBbU/Da1TFaFnHZF7JYWTLXmrNW3DPV3bRU33ST4PUS4rVR5DXQ5fYP57ZOqTbNqvcMrLdLbneKMDfJcfgIM7hHdTiGtvjGOLkGOnlGu/lHPbmH/vnI////6dkNu4AAAABYktHRGNcvi2qAAAAB3RJTUUH4wISEh00Ha7gTwAAAIl6VFh0UmF3IHByb2ZpbGUgdHlwZSBleGlmAAAImVWO0Q3DMAhE/5kiI2DAB4xTRYnUDTp+cJzK7fuA0wkO6Pi8T9oGjYWseyABLiwt5VUieKLMTbiNXnXydG2lZNmkMgUynG0N2uN/6YrA6eaOjh27VLocKhpVa49GKo83coV43D/U2X//1j/QBUTJLDCZZckEAAAAbElEQVQI12NgYGRiZmFlY+fg5OLm4eXjFxAUEhYRFROXkJSSlpGVk1dQVFJWUVVT19DU0tbR1dM3MDQyNjE1M7ewtLK2sbWzd3B0cnZxdXP38PTy9vH18w8IDAoOCQ0Lj4iMio6JjYtPSEwCAHgmEvTi4/F5AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTAyLTE4VDE4OjI5OjUyKzAxOjAwUKWXygAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMi0xOFQxODoyOTo1MiswMTowMCH4L3YAAAAWdEVYdGV4aWY6RXhpZkltYWdlTGVuZ3RoADl2GPUTAAAAF3RFWHRleGlmOkV4aWZJbWFnZVdpZHRoADg4OE4hyKYAAAASdEVYdGV4aWY6RXhpZk9mZnNldAA2Njd3Z2EAAAAddEVYdGV4aWY6U29mdHdhcmUAU2hvdHdlbGwgMC4yOC40Lr5VtAAAAABJRU5ErkJggg=='));

    const functionNode = new Nodes.FunctionNode(
      `vec3 isoColorFunc${this.id}(sampler2D textureMap, float min, float max, float data){
        vec2 colorPosition = vec2((data - min) / (max - min), 0.0);

        return vec3(texture2D(textureMap, colorPosition));
      }`
    );

    this.minNode = new Nodes.FloatNode(min);
    this.maxNode = new Nodes.FloatNode(max);

    this.functionCallNode = new Nodes.FunctionCallNode(functionNode, [this.textureNode, this.minNode, this.maxNode, this.inputNode]);

    this.addColorNode(NodeOperation.ASSIGN, this.functionCallNode);

    this.buildMaterial();

    this.initialized = true;
  }

  setInput(input?: Input) : void {
    super.setInput(input);

    if (this.initialized) {
      this.functionCallNode.inputs = [this.textureNode, this.minNode, this.maxNode, this.inputNode];

      this.buildMaterial();
    }
  }

  set min (value: number) {
    this.minNode.value = value;
  }

  get min () {
    return this.minNode.value;
  }

  set max (value: number) {
    this.maxNode.value = value;
  }

  get max () {
    return this.maxNode.value;
  }

  get inputDimension () : InputDimension {
    return 1;
  }

  private initialized: boolean = false;

  private functionCallNode: Nodes.FunctionCallNode;

  private minNode: Nodes.FloatNode;
  private maxNode: Nodes.FloatNode;

  private textureNode: Nodes.TextureNode;

  protected inputs: [Component];
  protected inputNode: Nodes.Node;

}
