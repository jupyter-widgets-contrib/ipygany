import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

/**
 * 3-D Scene class
 */
export
class Scene {

  constructor (el: HTMLElement) {
    this.el = el;

    const { width, height } = this.el.getBoundingClientRect();

    this.camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.001,
      999999999
    );
    this.camera.position.z = 0.2;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    this.scene.add(ambientLight);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

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
   * Resize scene
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

  /**
   * Animation
   */
  private animate () {
    this.animationID = requestAnimationFrame(this.animate.bind(this));

    this.renderer.render(this.scene, this.camera);

    this.controls.update();
  }

  el: HTMLElement;

  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  controls: TrackballControls;

  animationID: number;
}
