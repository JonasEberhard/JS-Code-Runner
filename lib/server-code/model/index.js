'use strict';

const ServerCode        = require('../api'),
      events            = require('../events'),
      ServiceDescriptor = require('./service-descriptor'),
      jsdoc             = require('../../util/jsdoc'),
      logger            = require('../../util/logger');

class Dictionary {
  keys() {
    return Object.keys(this);
  }

  values() {
    return this.keys().map(key => this[key]);
  }
}

class Definitions {
  constructor() {
    this.files = [];
    this.types = {};
  }

  addFile(file) {
    if (this.files.indexOf(file) === -1) {
      this.files.push(file);

      const foundClasses = jsdoc.describeClasses(file);
      foundClasses.forEach(classDef => this.types[classDef.name] = classDef);
    }
  }
}

class ServerCodeModel {
  constructor() {
    this.types = new Dictionary();
    this.handlers = new Dictionary();
    this.services = new Dictionary();
    this.definitions = new Definitions();
    this.errors = [];
  }

  addHandler(handler) {
    const key = ServerCodeModel.computeHandlerKey(handler.eventId, handler.target);

    if (this.handlers[key]) {
      const methodName = events.get(handler.eventId).name;

      throw new Error(`{${methodName}(${handler.target}) event handler already exists`);
    }

    this.handlers[key] = handler;
  }

  getHandler(eventId, target) {
    return this.handlers[ServerCodeModel.computeHandlerKey(eventId, target)];
  }

  getService(serviceName) {
    return this.services[serviceName];
  }

  addService(service, file) {
    if (this.services[service.name]) {
      throw new Error(`"["${service.name}" service already exists`);
    }

    this.services[service.name] = { name: service.name, clazz: service, file };
    this.definitions.addFile(file);
  }

  addType(type, file) {
    if (this.types[type.name]) {
      throw new Error(`"["${type.name}" custom type already exists`);
    }

    this.types[type.name] = { name: type.name, clazz: type, file };
    this.definitions.addFile(file);
  }

  addError(error, serverCodeFile, erredFile) {
    this.errors.push({ error, serverCodeFile, erredFile });
  }

  setDefinitions(definitions) {
    if (definitions) {
      this.definitions.files = definitions.files;
      this.definitions.types = definitions.types;
    }
  }

  get classMappings() {
    const result = {};

    Object.keys(this.types).forEach(name => {
      result[name] = this.types[name].clazz;
    });

    return result;
  }

  get summary() {
    const handlers = this.handlers.values(),
          timers   = handlers.filter(h => h.timer);

    /*eslint prefer-template: 0*/
    return 'event handlers: ' + (handlers.length - timers.length) +
      ', timers: ' + timers.length +
      ', custom types: ' + this.types.values().length +
      ', services: ' + this.services.values().length +
      ', errors: ' + this.errors.length;
  }

  describeService(name) {
    return ServiceDescriptor.buildXML([name], this.definitions.types);
  }

  describeServices() {
    return ServiceDescriptor.buildXML(this.services.keys(), this.definitions.types);
  }

  loadFiles(basePath, files) {
    ServerCode.load(basePath, files, this);
  }

  static computeHandlerKey(eventId, target) {
    const isTimer = events.get(eventId).provider === events.providers.TIMER;

    if (isTimer) {
      target = JSON.parse(target).timername;
    }

    return [eventId, target].join('-');
  }

  /**
   * @param {String} basePath
   * @param {Array.<String>} files
   * @returns {ServerCodeModel}
   */
  static build(basePath, files) {
    logger.info('Building Model..');

    const model = new ServerCodeModel();
    model.loadFiles(basePath, files);

    logger.info(`Model Build completed: ${model.summary}`);

    return model;
  }
}

module.exports = ServerCodeModel;