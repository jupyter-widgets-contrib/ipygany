/**
 * 3-D Scene class
 */
export
class Scene {

  constructor (el: HTMLElement) {
    this.el = el;
    console.log('constructed Scene');
  }

  el: HTMLElement;
}
