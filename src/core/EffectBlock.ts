import {
  NodeMesh
} from './NodeMesh';

import {
  Block
} from './Block';


/**
 * Effect class
 * This is the base class for all the effects: IsoColor, ClipPlane...
 */
export
class Effect extends Block {

  constructor (parent: Block) {
    super(parent.vertices, parent.data);

    this.parent = parent;

    this.triangleIndices = parent.triangleIndices;
    this.tetrahedronIndices = parent.tetrahedronIndices;

    // Copy parent meshes, this does not copy geometries (data buffers are not copied)
    this.meshes = parent.meshes.map((nodeMesh: NodeMesh) => nodeMesh.copy() );
  }

  parent: Block;

}
