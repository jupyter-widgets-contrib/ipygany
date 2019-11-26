import * as Nodes from 'three/examples/jsm/nodes/Nodes';

export
class IdentityNode extends Nodes.Node {

  constructor (value: Nodes.Node) {
    super();

    this.value = value;
  }

  getType (builder: Nodes.NodeBuilder) {
    return this.value.getType(builder);
  }

  generate (builder: Nodes.NodeBuilder, output: string) {
    // @ts-ignore: See https://github.com/mrdoob/three.js/pull/18008
    return this.value.generate(builder, output);
  }

  copy (source: IdentityNode) {
    super.copy(source);

    this.value = source.value;

    return this;
  }

  toJSON (meta?: object | string ): object{
    return this.value.toJSON();
  }

  value: Nodes.Node;

  static nodeType = 'IdentityNode';

}
