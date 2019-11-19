import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  Component
} from './Data';


export
enum NodeOperation {
    ASSIGN,
    SUB,
    ADD,
    DIV,
    MUL,
}

export
type MeshConstructor = new (geometry: THREE.BufferGeometry, material: Nodes.StandardNodeMaterial) => THREE.Mesh;

export
type NodeOperationResult<T extends Nodes.Node> = T | Nodes.OperatorNode;


export
class NodeOperator<T extends Nodes.Node> {

  constructor (operation: NodeOperation, rhs: NodeOperationResult<T>) {
    this.operation = operation;
    this.rhs = rhs;
  }

  operate (lhs: NodeOperationResult<T>) : NodeOperationResult<T> {
    switch (this.operation) {
      case NodeOperation.ASSIGN:
        return this.rhs;
        break;
      case NodeOperation.SUB:
        return new Nodes.OperatorNode(lhs, this.rhs, Nodes.OperatorNode.SUB);
        break;
      case NodeOperation.ADD:
        return new Nodes.OperatorNode(lhs, this.rhs, Nodes.OperatorNode.ADD);
        break;
      case NodeOperation.DIV:
        return new Nodes.OperatorNode(lhs, this.rhs, Nodes.OperatorNode.DIV);
        break;
      case NodeOperation.MUL:
        return new Nodes.OperatorNode(lhs, this.rhs, Nodes.OperatorNode.MUL);
        break;
    }
  }

  operation: NodeOperation;
  rhs: NodeOperationResult<T>;

}


/**
 * NodeMesh class
 * This class contains a THREE.Mesh that has a Nodes.StandardNodeMaterial
 */
export
class NodeMesh {

  constructor (T: MeshConstructor, geometry: THREE.BufferGeometry) {
    this.meshCtor = T;

    this.geometry = geometry;
    this.material = new Nodes.StandardNodeMaterial();
    this.mesh = new T(geometry, this.material);

    this._defaultColor = '#6395b0';
    this.defaultColorNode = new Nodes.ColorNode(this._defaultColor);
  }

  buildMaterial () {
    let position = new Nodes.PositionNode();
    let alpha = new Nodes.FloatNode(1.0);
    let color: NodeOperationResult<Nodes.Node> = this.defaultColorNode;

    for (const colorOperator of this.colorOperators) {
      color = colorOperator.operate(color);
    }
    // TODO: Same for position Node, alpha Node and varyings

    this.material.flatShading = true;
    this.material.side = THREE.DoubleSide;

    // @ts-ignore
    this.material.transform = position;
    // @ts-ignore
    this.material.alpha = alpha;
    // @ts-ignore
    this.material.color = color;

    this.material.build();
  }

  /**
   * Add a component to this NodeMesh, so that it can be used in shaders.
   */
  addComponent (component: Component) {
    component.addToGeometry(this.geometry);
  }

  copy () {
    const copy = new NodeMesh(this.meshCtor, this.geometry);

    // TODO: Copy other operators
    copy.colorOperators = this.colorOperators;

    copy.scale = this.scale;
    copy.defaultColor = this.defaultColor;

    return copy;
  }

  set scale (scale: THREE.Vector3) {
    this._scale = scale;
    this.mesh.scale.set(scale.x, scale.y, scale.z);
  }

  get scale () {
    return this._scale;
  }

  set defaultColor (defaultColor: string) {
    this._defaultColor = defaultColor;

    this.defaultColorNode.value = new THREE.Color(this._defaultColor);
  }

  get defaultColor () {
    return this._defaultColor;
  }

  addColorNode (operation: NodeOperation, colorNode: Nodes.Node) {
    this.colorOperators.push(new NodeOperator<Nodes.Node>(operation, colorNode));
  }

  dispose () {
    this.geometry.dispose();
    this.material.dispose();
  }

  geometry: THREE.BufferGeometry;
  material: Nodes.StandardNodeMaterial;
  mesh: THREE.Mesh;

  private meshCtor: MeshConstructor;

  // private transformOperators: NodeOperator<Nodes.TransformNode>[];
  // private alphaOperators: NodeOperator<Nodes.AlphaNode>[];
  private colorOperators: NodeOperator<Nodes.Node>[] = [];

  private _defaultColor: string;
  private defaultColorNode: Nodes.ColorNode;
  private _scale: THREE.Vector3;

}
