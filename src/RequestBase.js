const querystring = require("querystring");

/**
 * The base request class implementing the chainable methods.
 * i.e `.set()` `.query()`
 * this is subclassed by {@link Ladybug} and {@link LadybugRequest}
 * to reduce duplicate code for defining this functions.
 * @private
 */
class RequestBase {
  constructor(options = {}) {
    this.baseURL = options.baseURL;
    this.headers = options.headers || {};
    this._query = options.query || {};
    this.data = options.data || "";
    this.promiseLibrary = options.promise || Promise;
    this.plugins = options.plugins || [];
    this.validateStatus = options.status || function(s) { return s >= 200 && s < 400; };
  }

  /**
   * Sets a header value
   * @param {String|Object} key - Header object or a string for key
   * @param {String} value - Header value optional if key is a query or object
   * @returns {this}
   * @example
   * req.set({ Authorization: "FooBar", Foo: "Bar" }); // Object
   * req.set("Authorization", "FooBar"); // Key, Value
   * req.set("Authorization=FooBar&Foo=Bar"); // Querystring
   */
  set(key, value) {
    if(typeof key === "object") { // .set({ Authorization: "foobar" });
      Object.assign(this.headers, key);
      return this;
    }
    if(typeof key === "string" && typeof value === "string") { // .set("foo", "bar")
      this.headers[key] = value;
      return this;
    }
    if(typeof key === "string") { // .set("Authorization=foo&another=bar");
      Object.assign(this.headers, querystring.parse(key));
      return this;
    }
    throw new Error("Arguments did not match any of overloads (str, str), (str), (object)");
  }

  query(key, value) {
    if(typeof key === "object") {
      Object.assign(this._query, key);
      return this;
    }
    if(typeof key === "string" && typeof value === "string") {
      this._query[key] = value;
      return this;
    }
    if(typeof key === "string") {
      Object.assign(this._query, querystring.parse(key));
      return this;
    }
    throw new Error("Arguments did not match any of overloads (str, str), (str), (object)");
  }

  /**
   * Send some data to the server
   * @param {Object|String|Buffer|Stream} data - The data to send
   * @returns {this}
   */
  send(data) {
    if(this.headers["Content-Type"] && this.headers["Content-Type"].includes("application/x-www-form-urlencoded")) {
      this.data = querystring.stringify(data);
    } else if(typeof data === "object") {
      this.data = JSON.stringify(data);
      this.set("Content-Type", "application/json");
    } else this.data = data;
    return this;
  }

  /**
   * Changes the current promise library being used, note the promise library
   * must have a similar interface to the native one
   * The default library is the global `Promise` so incase you are overriding the
   * global promise this is unnecessary
   * @param {any} lib - The promise library
   * @returns {this}
   * @example
   * req.promise(require("bluebird"));
   */
  promise(lib) {
    this.promiseLibrary = lib;
    return this;
  }

  /**
   * Adds a plugin
   * @param {Function} plugin - The plugin function
   * @returns {this}
   */
  use(plugin) {
    if(typeof plugin !== "function") throw new Error("Plugin must be a function");
    this.plugins.add(plugin);
    return this;
  }

  json() {
    return this.set("Content-Type", "application/json");
  }

  status(callback) {
    if(typeof callback !== "function") throw new Error("Callback must be a function");
    this.validateStatus = callback;
    return this;
  }

  static applyTo(cls, ignore = []) {
    for(const prop of ["set", "query", "promise", "use", "status", "send", "json"]) {
      if(ignore.includes(prop)) continue;
      Object.defineProperty(cls.prototype, prop, Object.getOwnPropertyDescriptor(RequestBase.prototype, prop));
    }
  }
}

module.exports = RequestBase;
