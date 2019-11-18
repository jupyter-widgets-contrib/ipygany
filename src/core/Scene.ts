import * as THREE from 'three';

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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(-1, 1.75, 1);
    this.scene.add(directionalLight);
  }

  /**
   * Add an Odysis block to the scene
   */
  addChild (block: Block) {
    this.children.push(block);

    block.addToScene(this.scene);
  }

  dispose () {
    this.scene.dispose();
  }

  scene: THREE.Scene;

  private children: Block[] = [];

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

    this.renderer.render(this.scene.scene, this.camera);

    this.controls.update();
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

  private animationID: number;

}
