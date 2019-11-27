import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';

import {
  TrackballControls
} from 'three/examples/jsm/controls/TrackballControls';

import {
  Block
} from './Block';


/**
 * 3-D Scene class
 */
export
class Scene {

  constructor () {
    this.scene = new THREE.Scene();

    // light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
    directionalLight.position.set(-1, 1.75, 1);
    this.scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
    hemiLight.position.set(0, 2, 0);
    this.scene.add(hemiLight);
  }

  /**
   * Add an Odysis block to the scene
   */
  addChild (block: Block) {
    this.blocks.push(block);
    block.addToScene(this.scene);
  }

  handleCameraMoveEnd (cameraPosition: THREE.Vector3) {
    for (const block of this.blocks) {
      block.handleCameraMoveEnd(cameraPosition);
    }
  }

  dispose () {
    this.scene.dispose();

    for (const block of this.blocks) {
      block.dispose();
    }
  }

  scene: THREE.Scene;
  blocks: Block[] = [];

}


/**
 * 3-D Renderer class
 */
export
class Renderer {

  constructor (el: HTMLElement, scene: Scene) {
    this.el = el;

    this.scene = scene;
  }

  initialize () {
    const { width, height } = this.el.getBoundingClientRect();

    this.camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.001,
      999999999
    );
    this.camera.position.z = 2;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearAlpha(0.);

    this.renderer.setSize(width, height);
    this.renderer.localClippingEnabled = true;

    this.el.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new TrackballControls(
      this.camera,
      this.el
    );

    this.controls.screen.width = width;
    this.controls.screen.height = height;

    this.controls.rotateSpeed = 2.5;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.9;
    this.controls.dynamicDampingFactor = 0.9;

    this.controls.addEventListener('end', this.handleCameraMoveEnd.bind(this));

    this.animate();
  }

  /**
   * Resize renderer
   */
  resize () {
    const { width, height } = this.el.getBoundingClientRect();

    this.renderer.setSize(width, height);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.controls.handleResize();

    this.controls.screen.width = width;
    this.controls.screen.height = height;
  }

  set backgroundColor(color: string) {
    this.renderer.setClearColor(new THREE.Color(color));
  }

  /**
   * Animation
   */
  private animate () {
    this.animationID = window.requestAnimationFrame(this.animate.bind(this));

    // This is a workaround for github.com/mrdoob/three.js/issues/12132
    for (const child of this.scene.scene.children) {
      if (child instanceof THREE.Mesh && child.material instanceof Nodes.StandardNodeMaterial) {
        const id = child.material.uuid;
        // @ts-ignore
        const version = child.material.version

        if (id in this.materialVersions && this.materialVersions[id] != version) {
          child.material.needsUpdate = true;
        }

        this.materialVersions[id] = version;
      }
    }

    this.renderer.render(this.scene.scene, this.camera);

    this.controls.update();
  }

  handleCameraMoveEnd () {
    this.scene.handleCameraMoveEnd(this.camera.position);
  }

  dispose () {
    window.cancelAnimationFrame(this.animationID);

    this.controls.dispose();

    this.renderer.dispose();
  }

  el: HTMLElement;

  scene: Scene;

  camera: THREE.PerspectiveCamera;
  controls: TrackballControls;
  renderer: THREE.WebGLRenderer;

  materialVersions: { [keys: string]: number; } = {};

  private animationID: number;

}
