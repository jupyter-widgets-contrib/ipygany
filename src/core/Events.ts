import * as Backbone from 'backbone';


/**
 * Event class.
 */
export
abstract class Events {

  constructor () {
    this.eventDispatcher = {...Backbone.Events};
  }

  on (event: string, callback: () => void, context?: any) {
    if (context == undefined) {
      this.eventDispatcher.on(event, callback);
    } else {
      this.eventDispatcher.on(event, callback, context);
    }
  }

  off (event: string, callback: () => void, context?: any) {
    if (context == undefined) {
      this.eventDispatcher.off(event, callback);
    } else {
      this.eventDispatcher.off(event, callback, context);
    }
  }

  trigger (event: string) {
    this.eventDispatcher.trigger(event);
  }

  private eventDispatcher: any;

}
