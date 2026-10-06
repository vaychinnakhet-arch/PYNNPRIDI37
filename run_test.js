const domMock = new Proxy(function(){}, { 
  get: () => domMock,
  apply: () => domMock,
  set: () => true
});
let loadedCallback;
global.document = new Proxy({}, {
  get: (target, prop) => {
    if (prop === 'addEventListener') {
      return (event, callback) => {
        if (event === 'DOMContentLoaded') loadedCallback = callback;
      };
    }
    return domMock;
  }
});
global.window = new Proxy(global, {
    get: (t, p) => p === 'addEventListener' ? domMock : (global[p] || domMock)
});
global.localStorage = domMock;
Object.defineProperty(global, 'navigator', { value: domMock, writable: true });
global.alert = console.log;
global.supabase = { createClient: domMock };
import("./test.js").then(() => {
  if (loadedCallback) {
    try {
      loadedCallback();
    } catch(e) {
      console.error("Error in DOMContentLoaded:", e);
    }
  }
}).catch(e => console.error("Error on import:", e));
