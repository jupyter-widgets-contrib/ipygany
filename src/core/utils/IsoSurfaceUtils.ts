const BinaryTree: any = require('binary-search-tree');

import {
  TypedArray
} from './types';

import {
  Data
} from '../Data';


export
function interpolate (value: number, x1: number, val1: number, x2: number, val2: number) {
  return (value - val1) * (x2 - x1) / (val2 - val1) + x1;
};

namespace Geometry {

  export
  type vec3 = [number, number, number];

  export
  function cross(a: vec3, b: vec3) : vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ]
  }

  export
  function dot(a: vec3, b: vec3) : number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }

}


/**
 * IsoSurfaceUtils class. This class helps computing iso-surfaces using binary search trees.
 */
export
class IsoSurfaceUtils {

  constructor (vertices: Float32Array, tetrahedronIndices: Uint32Array) {
    this.initialVertices = vertices;
    this.initialTetrahedronIndices = tetrahedronIndices;
  }

  updateInput (inputDataArray: TypedArray, inputData: Data[]) {
    this.treeMin = this.createTree(inputDataArray, 'min');
    this.treeMax = this.createTree(inputDataArray, 'max');

    this.previousValue = null;

    this.inputDataArray = inputDataArray;
    this.inputData = inputData;
  }

  computeIsoSurface (value: number) : [Float32Array, Uint32Array] {
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
    const tetrahedronCandidates = Emin.filter(x => Emax.has(x));

    const vertices: number[] = [];
    // const isoSurfaceData = this.inputData.map((data: Data) => data.copy());

    // Booleans representing if tetrahedron vertices data are over value
    const bl: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    // Booleans representing if tetrahedron vertices data are under value
    const bu: [boolean, boolean, boolean, boolean] = [false, false, false, false];

    let interVertices: number[];

    // Tetra index
    let i: number;

    // Point 1 and 2 indices
    let i1: number;
    let i2: number;

    // Vertex 1 and 2
    let v1: Geometry.vec3;
    let v2: Geometry.vec3;
    let v3: Geometry.vec3;

    // Vectors
    let v12: Geometry.vec3;
    let v23: Geometry.vec3;
    let v13: Geometry.vec3;

    // Vertex data 1 and 2
    let d1: number;
    let d2: number;

    // Triangle normal
    let normal1: Geometry.vec3 = [0., 0., 0.];
    let normal2: Geometry.vec3 = [0., 0., 0.];

    console.log(this.inputData);

    for (let j = 0, len = tetrahedronCandidates.length; j < len; j++) {
      i = tetrahedronCandidates[j];

      bl[0] = this.inputDataArray[this.initialTetrahedronIndices[i]] >= value;
      bl[1] = this.inputDataArray[this.initialTetrahedronIndices[i+1]] >= value;
      bl[2] = this.inputDataArray[this.initialTetrahedronIndices[i+2]] >= value;
      bl[3] = this.inputDataArray[this.initialTetrahedronIndices[i+3]] >= value;

      bu[0] = this.inputDataArray[this.initialTetrahedronIndices[i]] <= value;
      bu[1] = this.inputDataArray[this.initialTetrahedronIndices[i+1]] <= value;
      bu[2] = this.inputDataArray[this.initialTetrahedronIndices[i+2]] <= value;
      bu[3] = this.inputDataArray[this.initialTetrahedronIndices[i+3]] <= value;

      // Uncomment those lines if you loop on tetras that are note
      // sliced by the iso-surface. Here we assume that tetrahedrons
      // sorting is efficient, and we don't need to check this.
      /*if (!(bl[0] || bl[1] || bl[2] || bl[3]) ||
          !(bu[0] || bu[1] || bu[2] || bu[3])) {
        continue;
      }*/

      interVertices = [];

      // dataLen = inputDataArrays.length;
      // interDatas = new Array(dataLen);
      // while (dataLen--) { interDatas[dataLen] = []; }

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
            // inputDataArrays.forEach((inputDataArray, dataIndex) => {
            //   interDatas[dataIndex].push(interpolate(
            //     value,
            //     inputDataArray[i1], d1,
            //     inputDataArray[i2], d2)
            //   );
            // });
          }
        }
      }

      // Create triangles where data is equal to value
      v1 = [interVertices[0], interVertices[1], interVertices[2]];
      v2 = [interVertices[3], interVertices[4], interVertices[5]];
      v3 = [interVertices[6], interVertices[7], interVertices[8]];

      v12 = [v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2]];
      v23 = [v3[0]-v2[0], v3[1]-v2[1], v3[2]-v2[2]];
      v13 = [v3[0]-v1[0], v3[1]-v1[1], v3[2]-v1[2]];

      normal1 = Geometry.cross(v12, v23);
      normal2 = Geometry.cross(v12, v13);

      // Create new triangles
      if (Geometry.dot(normal1, normal2) < 0.0) {
        // Create first triangle
        vertices.push(
          v1[0], v1[1], v1[2],
          v2[0], v2[1], v2[2],
          v3[0], v3[1], v3[2]
        );

        // interDatwas.forEach((interData, dataIndex) => {
        //   surfaceDataArrays[dataIndex].push(interData[0]);
        //   surfaceDataArrays[dataIndex].push(interData[1]);
        //   surfaceDataArrays[dataIndex].push(interData[2]);
        // });

        // If we have 4 points (4*3 coordinates, so 2 triangles)
        if (interVertices.length === 12) {
          vertices.push(
            v2[0], v2[1], v2[2],
            interVertices[9], interVertices[10], interVertices[11],
            v3[0], v3[1], v3[2]
          );

          // interDatas.forEach((interData, dataIndex) => {
          //   surfaceDataArrays[dataIndex].push(interData[1]);
          //   surfaceDataArrays[dataIndex].push(interData[3]);
          //   surfaceDataArrays[dataIndex].push(interData[2]);
          // });
        }
      } else {
        // Create first triangle
        vertices.push(
          v1[0], v1[1], v1[2],
          v3[0], v3[1], v3[2],
          v2[0], v2[1], v2[2]
        );

        // interDatas.forEach((interData, dataIndex) => {
        //   surfaceDataArrays[dataIndex].push(interData[0]);
        //   surfaceDataArrays[dataIndex].push(interData[2]);
        //   surfaceDataArrays[dataIndex].push(interData[1]);
        // });

        // If we have 4 points (4*3 coordinates, so 2 triangles)
        if (interVertices.length === 12) {
          vertices.push(
            v2[0], v2[1], v2[2],
            v3[0], v3[1], v3[2],
            interVertices[9], interVertices[10], interVertices[11]
          );

          // interDatas.forEach((interData, dataIndex) => {
          //   surfaceDataArrays[dataIndex].push(interData[1]);
          //   surfaceDataArrays[dataIndex].push(interData[2]);
          //   surfaceDataArrays[dataIndex].push(interData[3]);
          // });
        }
      }
    }

    // Create list of indices: [0, 1, 2, ..., numTriangles-2, numTriangles-1]
    const numTriangles = vertices.length / 3;
    const isoSurfaceTrianglesIndices = Uint32Array.from(Array(numTriangles).keys());

    const isoSurfaceVertices = new Float32Array(vertices);

    this.previousValue = value;

    return [isoSurfaceVertices, isoSurfaceTrianglesIndices];
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
        i
      );
    }

    return binaryTree;
  }

  private initialVertices: Float32Array;
  private initialTetrahedronIndices: Uint32Array;

  private previousValue: number | null = null;

  private treeMin: any;
  private treeMax: any;

  private Emin: number[];
  private Emax: number[];

  private inputDataArray: TypedArray;
  private inputData: Data[] = [];

}
