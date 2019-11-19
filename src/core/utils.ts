import * as THREE from 'three';

export
function uuid() : string {
  return 'v' + THREE.Math.generateUUID().replace(/-/gi, '');
}
