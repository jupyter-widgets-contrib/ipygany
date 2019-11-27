const BinaryTree: any = require('binary-search-tree');

import * as THREE from 'three';

import {
  TypedArray
} from './types';

import {
  Data, DataDict, datalistToDict
} from '../Data';

import {
  NodeMesh
} from '../NodeMesh';


export
function interpolate (value: number, x1: number, val1: number, x2: number, val2: number) {
  return (value - val1) * (x2 - x1) / (val2 - val1) + x1;
};


/**
 * IsoSurfaceUtils class. This class helps computing iso-surfaces using binary search trees.
 */
export
class IsoSurfaceUtils {

  constructor (vertices: Float32Array, tetrahedronIndices: Uint32Array, data: Data[], dynamic: boolean = false) {
    this.initialVertices = vertices;
    this.initialTetrahedronIndices = tetrahedronIndices;
    this.initialData = data;

    this.dynamic = dynamic;

    this.geometry = new THREE.BufferGeometry();
    this._vertices = new Float32Array(0);

    const vertexBuffer = new THREE.BufferAttribute(this._vertices, 3);
    this.geometry.setAttribute('position', vertexBuffer);

    const dataShallowCopy = this.initialData.map((data: Data) => data.copy(false));
    this._isoSurfaceMesh = new NodeMesh(THREE.Mesh, this.geometry, dataShallowCopy);
  }

  updateInput (inputDataArray: TypedArray) {
    if (!this.dynamic) {
      this.treeMin = this.createTree(inputDataArray, 'min');
      this.treeMax = this.createTree(inputDataArray, 'max');
    }

    this.previousValue = null;

    this.inputDataArray = inputDataArray;
  }

  computeIsoSurface (value: number) {
    let tetrahedronCandidates: number[];

    if (!this.dynamic) {
      // Compute
      // Emin(value) = {t in tetras/ t.dataMin < value}
      // Emax(value) = {t in tetras/ value < t.dataMax}
      // Tetras sliced by the iso-surface are those which are in Emin AND Emax
      if (this.previousValue != null) {
        if (value > this.previousValue) {
          // If Emin(previousValue) already computed then
          // Emin(value) = Emin(previousValue) Union {t in tetras/ previousValue < t.dataMin < value}
          this.Emin = this.Emin.concat(
            this.treeMin.betweenBounds(
              { $gte: this.previousValue, $lt: value })
          );
          this.Emax = this.treeMax.betweenBounds({ $gt: value });
        } else {
          this.Emin = this.treeMin.betweenBounds({ $lt: value });
          // If Emax(previousValue) already computed then
          // Emax(value) = Emax(previousValue) Union {t in tetras/ value < t.dataMin < previousValue}
          this.Emax = this.Emax.concat(
            this.treeMax.betweenBounds(
              { $gt: value, $lte: this.previousValue })
          );
        }
      } else {
        this.Emin = this.treeMin.betweenBounds({ $lt: value });
        this.Emax = this.treeMax.betweenBounds({ $gt: value });
      }

      const Emin = this.Emin;
      const Emax = new Set(this.Emax);

      if (Emin == null) {
        throw 'Unreachable';
      }

      // Compute intersection of Emin and Emax
      tetrahedronCandidates = Emin.filter(x => Emax.has(x));
    } else {
      tetrahedronCandidates = Array.from(Array(this.initialTetrahedronIndices.length / 4).keys());
    }

    const vertices: number[] = [];
    const data: DataDict = datalistToDict(this.initialData, false);

    // Booleans representing if tetrahedron vertices data are over value
    const bl: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    // Booleans representing if tetrahedron vertices data are under value
    const bu: [boolean, boolean, boolean, boolean] = [false, false, false, false];

    let interVertices: number[];
    let interData: DataDict;

    // Tetra index
    let i: number;

    // Point 1 and 2 indices
    let i1: number;
    let i2: number;

    // Vertex 1 and 2
    let v1: number[];
    let v2: number[];
    let v3: number[];

    // Vertex data 1 and 2
    let d1: number;
    let d2: number;

    for (let j = 0, len = tetrahedronCandidates.length; j < len; j++) {
      i = 4 * tetrahedronCandidates[j];

      bl[0] = this.inputDataArray[this.initialTetrahedronIndices[i]] >= value;
      bl[1] = this.inputDataArray[this.initialTetrahedronIndices[i+1]] >= value;
      bl[2] = this.inputDataArray[this.initialTetrahedronIndices[i+2]] >= value;
      bl[3] = this.inputDataArray[this.initialTetrahedronIndices[i+3]] >= value;

      bu[0] = this.inputDataArray[this.initialTetrahedronIndices[i]] <= value;
      bu[1] = this.inputDataArray[this.initialTetrahedronIndices[i+1]] <= value;
      bu[2] = this.inputDataArray[this.initialTetrahedronIndices[i+2]] <= value;
      bu[3] = this.inputDataArray[this.initialTetrahedronIndices[i+3]] <= value;

      // If the tetra is not cut by the iso-surface, we continue to the next one
      if (!(bl[0] || bl[1] || bl[2] || bl[3]) ||
          !(bu[0] || bu[1] || bu[2] || bu[3])) {
        continue;
      }

      interVertices = [];
      interData = datalistToDict(this.initialData, false);

      // Find if some of the edges are sliced by the iso-surface
      for (let k = 0; k < 3; k++) {
        for(let l = k + 1; l < 4 ; l++ ) {
          // If the edge is sliced
          if ((bl[k] && bu[l]) || (bu[k] && bl[l])) {
            i1 = this.initialTetrahedronIndices[i + k]; // Index point 1
            i2 = this.initialTetrahedronIndices[i + l]; // Index point 2

            // Vertex 1
            v1 = [
              this.initialVertices[3*i1],
              this.initialVertices[3*i1+1],
              this.initialVertices[3*i1+2],
            ]
            d1 = this.inputDataArray[i1];

            // Vertex 2
            v2 = [
              this.initialVertices[3*i2],
              this.initialVertices[3*i2+1],
              this.initialVertices[3*i2+2],
            ]
            d2 = this.inputDataArray[i2];

            // Interpolate on positions
            interVertices.push(
              interpolate(value, v1[0], d1, v2[0], d2),
              interpolate(value, v1[1], d1, v2[1], d2),
              interpolate(value, v1[2], d1, v2[2], d2)
            );

            // Interpolate on each data
            for (const data of this.initialData) {
              for (const component of data.components) {
                interData[data.name][component.name].array.push(interpolate(
                  value,
                  component.array[i1], d1,
                  component.array[i2], d2,
                ));
              }
            }
          }
        }
      }

      // Create triangles where data is equal to value
      v1 = interVertices.slice(0, 3);
      v2 = interVertices.slice(3, 6);
      v3 = interVertices.slice(6, 9);

      // Create first triangle
      vertices.push(...v1, ...v3, ...v2);

      for (const dataName in interData) {
        for (const componentName in interData[dataName]) {
          const array = data[dataName][componentName].array;
          const interArray = interData[dataName][componentName].array;

          array.push(interArray[0], interArray[2], interArray[1]);
        }
      }

      // If we have 4 points (4*3 coordinates, so 2 triangles)
      if (interVertices.length === 12) {
        vertices.push(...v2, ...v3, ...interVertices.slice(9, 12));

        for (const dataName in interData) {
          for (const componentName in interData[dataName]) {
            const array = data[dataName][componentName].array;
            const interArray = interData[dataName][componentName].array;

            array.push(interArray[1], interArray[2], interArray[3]);
          }
        }
      }
    }

    this._vertices = new Float32Array(vertices);

    this._isoSurfaceMesh.vertices = this._vertices
    this._isoSurfaceMesh.updateData(data);

    this.previousValue = value;
  }

  get mesh () {
    return this._isoSurfaceMesh;
  }

  get vertices () : Float32Array {
    return this._vertices;
  }

  private createTree (dataArray: TypedArray, value: 'min' | 'max'='min') {
    const binaryTree = new BinaryTree.BinarySearchTree();
    const getValue = value == 'min' ? Math.min : Math.max;

    // Fill binary tree
    for (let i = 0; i < this.initialTetrahedronIndices.length; i += 4) {
      binaryTree.insert(
        getValue(
          dataArray[this.initialTetrahedronIndices[i]],
          dataArray[this.initialTetrahedronIndices[i+1]],
          dataArray[this.initialTetrahedronIndices[i+2]],
          dataArray[this.initialTetrahedronIndices[i+3]]
        ),
        i / 4
      );
    }

    return binaryTree;
  }

  private initialVertices: Float32Array;
  private initialTetrahedronIndices: Uint32Array;
  private initialData: Data[];
  private dynamic: boolean;

  private previousValue: number | null = null;

  private treeMin: any;
  private treeMax: any;

  private Emin: number[];
  private Emax: number[];

  private inputDataArray: TypedArray;

  private _isoSurfaceMesh: NodeMesh;
  private geometry: THREE.BufferGeometry;
  private _vertices: Float32Array;

}
