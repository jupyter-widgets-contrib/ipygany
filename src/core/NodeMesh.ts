import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  Data, DataDict
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

  constructor (T: MeshConstructor, geometry: THREE.BufferGeometry, data: Data[]) {
    this.meshCtor = T;

    this.geometry = geometry;
    this.material = new Nodes.StandardNodeMaterial();

    this.data = data;

    // TODO: Add those components lazily by looking over which nodes are used?
    for (const data of this.data) {
      for (const component of data.components) {
        this.geometry.setAttribute(component.shaderName, component.bufferAttribute);
      }
    }

    this.hasIndex = this.geometry.index != null;

    // @ts-ignore: Monkey patching material, workaround for github.com/mrdoob/three.js/issues/12132
    this.material.version = 0;

    this.mesh = new T(geometry, this.material);

    // We need to set this to false because we directly play with the position matrix
    this.mesh.matrixAutoUpdate = false;

    this._defaultColor = '#6395b0';
    this.defaultColorNode = new Nodes.ColorNode(this._defaultColor);
  }

  set vertices (vertices: Float32Array) {
    const vertexBuffer = (this.geometry.getAttribute('position') as THREE.Float32BufferAttribute);

    if (vertexBuffer.array.length == vertices.length) {
      vertexBuffer.set(vertices);
      vertexBuffer.needsUpdate = true;
    } else {
      this.geometry.deleteAttribute('position');
      const newVertexBuffer = new THREE.BufferAttribute(vertices, 3);
      this.geometry.setAttribute('position', newVertexBuffer);
    }
  }

  updateData (dict: DataDict) {
    for (const data of this.data) {
      for (const component of data.components) {
        const oldBuffer = component.bufferAttribute;

        component.array = new Float32Array(dict[data.name][component.name].array)

        if (component.bufferAttribute !== oldBuffer) {
          this.geometry.deleteAttribute(component.shaderName);
          this.geometry.setAttribute(component.shaderName, component.bufferAttribute);
        }
      }
    }
  }

  buildMaterial () {
    let position = new Nodes.PositionNode();
    let alpha: NodeOperationResult<Nodes.Node> = new Nodes.FloatNode(1.);
    let color: NodeOperationResult<Nodes.Node> = this.defaultColorNode;

    for (const colorOperator of this.colorOperators) {
      color = colorOperator.operate(color);
    }

    for (const alphaOperator of this.alphaOperators) {
      alpha = alphaOperator.operate(alpha);
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

    this.material.alphaTest = 0.1;

    this.material.build();

    // @ts-ignore
    this.material.version++;
  }

  copy () {
    const copy = new NodeMesh(this.meshCtor, this.geometry, this.data);

    copy.hasIndex = this.hasIndex;

    // TODO: Copy other operators
    copy.alphaOperators = this.alphaOperators.slice();
    copy.colorOperators = this.colorOperators.slice();

    copy.defaultColor = this.defaultColor;

    return copy;
  }

  copyMaterial (other: NodeMesh) {
    // TODO: Copy other operators
    this.alphaOperators = other.alphaOperators.slice();
    this.colorOperators = other.colorOperators.slice();

    this.defaultColor = other.defaultColor;
  }

  set matrix (matrix: THREE.Matrix4) {
    this.mesh.matrix.copy(matrix);
  }

  get boundingSphere () : THREE.Sphere {
    this.geometry.computeBoundingSphere();
    return this.geometry.boundingSphere;
  }

  set defaultColor (defaultColor: string) {
    this._defaultColor = defaultColor;

    this.defaultColorNode.value = new THREE.Color(this._defaultColor);
  }

  get defaultColor () {
    return this._defaultColor;
  }

  /**
   * Add a Color node to this mesh material
   */
  addColorNode (operation: NodeOperation, colorNode: Nodes.Node) {
    this.colorOperators.push(new NodeOperator<Nodes.Node>(operation, colorNode));
  }

  /**
   * Add an Alpha node to this mesh material
   */
  addAlphaNode (operation: NodeOperation, alphaNode: Nodes.Node) {
    this.alphaOperators.push(new NodeOperator<Nodes.Node>(operation, alphaNode));
  }

  /**
   * Sort triangle indices by distance Camera/triangle.
   */
  sortTriangleIndices (cameraPosition: THREE.Vector3) {
    // Project camera position in the mesh coordinate system
    const matrixInverse = new THREE.Matrix4().getInverse(this.mesh.matrix);
    const projectedCameraPosition = new THREE.Vector3()
      .copy(cameraPosition)
      .applyMatrix4(matrixInverse);

    if (this.mesh.type == 'Mesh') {
      const vertex = this.geometry.getAttribute('position').array;

      let indices: ArrayLike<number>;
      if (this.hasIndex) {
        indices = this.geometry.index.array;
      } else {
        indices = Array.from(Array(vertex.length / 3).keys());
      }

      // Triangle indices to sort
      const triangles = Array.from(Array(indices.length / 3).keys());

      // Compute distances camera/triangle
      const distances = triangles.map((i: number) => {
        const triangleIndex = 3 * i;
        const triangle = [indices[triangleIndex], indices[triangleIndex + 1], indices[triangleIndex + 2]];

        const v1Index = 3 * triangle[0];
        const v2Index = 3 * triangle[1];
        const v3Index = 3 * triangle[2];

        // Get the three vertices
        const v1 = [vertex[v1Index], vertex[v1Index + 1], vertex[v1Index + 2]];
        const v2 = [vertex[v2Index], vertex[v2Index + 1], vertex[v2Index + 2]];
        const v3 = [vertex[v3Index], vertex[v3Index + 1], vertex[v3Index + 2]];

        // The triangle position is the mean of it's three points positions
        const x = (v1[0] + v2[0] + v3[0]) / 3;
        const y = (v1[1] + v2[1] + v3[1]) / 3;
        const z = (v1[2] + v2[2] + v3[2]) / 3;

        const trianglePosition = new THREE.Vector3(x, y, z);
        return projectedCameraPosition.distanceToSquared(trianglePosition);
      });

      // Sort triangle indices
      triangles.sort((t1: number, t2: number) : number => {
        return distances[t2] - distances[t1];
      });

      // And then compute new vertex indices
      const newIndices = new Uint32Array(indices.length);
      for (let i = 0; i < triangles.length; i++) {
        const triangleIndex = triangles[i];

        newIndices[3 * i] = indices[3 * triangleIndex]
        newIndices[3 * i + 1] = indices[3 * triangleIndex + 1]
        newIndices[3 * i + 2] = indices[3 * triangleIndex + 2]
      }

      if (this.hasIndex) {
        this.geometry.index.set(newIndices);
        this.geometry.index.needsUpdate = true;
      } else {
        const indexBuffer = new THREE.BufferAttribute(newIndices, 1);
        this.geometry.setIndex(indexBuffer);
      }
    }
  }

  dispose () {
    this.geometry.dispose();
    this.material.dispose();
  }

  geometry: THREE.BufferGeometry;
  material: Nodes.StandardNodeMaterial;
  mesh: THREE.Mesh;
  readonly data: Data[];

  private meshCtor: MeshConstructor;

  // private transformOperators: NodeOperator<Nodes.TransformNode>[];
  private alphaOperators: NodeOperator<Nodes.Node>[] = [];
  private colorOperators: NodeOperator<Nodes.Node>[] = [];

  private _defaultColor: string;
  private defaultColorNode: Nodes.ColorNode;

  private hasIndex: boolean;

}
