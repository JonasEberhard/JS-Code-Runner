'use strict';

const ServerCodeModelDescriptor = require('../../model/descriptor'),
      argsUtil                  = require('./util/args'),
      domain                    = require('domain'),
      Backendless               = require('backendless'),
      Chalk                     = require('chalk'),
      logger                    = require('../../../util/logger');

/**
 * @typedef {Object} BlConfigurationItem
 * @property {String} name;
 * @property {String} value;
 * @property {String} productId;
 */

/**
 * @typedef {Object} InvocationContext
 *
 * @property {String} userId;
 * @property {String} userToken;
 * @property {Array.<String>} userRoles;
 * @property {String} deviceType;
 * @property {String} httpPath;
 * @property {Object.<String, String>} httpHeaders;
 * @property {Object.<String, String>} httpQueryParams;
 * @property {Object.<String, String>} httpPathParams;
 * @property {Array.<BlConfigurationItem>} configurationItems
 */

/**
 * @typedef {CodeRunnerTask} InvokeServiceTask
 * @property {String} serviceId
 * @property {String} className
 * @property {String} method
 * @property {String} provider
 * @property {Array<number>} arguments
 * @property {InvocationContext} invocationContextDto
 * @property {Object.<string, Object>} properties
 */

/**
 * @param {InvokeServiceTask} task
 * @returns {ServerCodeModel}
 */
function buildModel(task) {
  return ServerCodeModelDescriptor.load(task.codePath).buildModelForFile(task.provider);
}

function truncateNamespace(className) {
  const tokens = className.split('.');

  return tokens[tokens.length - 1];
}

function applyUser(userId, userToken) {
  if (userToken) {
    Backendless.LocalCache.set('stayLoggedIn', true);
    Backendless.LocalCache.set('current-user-id', userId);
    Backendless.LocalCache.set('user-token', userToken);
  }
}

/**
 * @param {!InvokeServiceTask} task
 * @param {?ServerCodeModel} model
 * @returns {Promise.<*>}
 */
function execute(task, model) {
  logger.info(`[${task.id}] [${Chalk.yellow('INVOKE SERVICE')}] ${Chalk.yellow(task.className + '.' + task.method)}`);

  return new Promise((resolve, reject) => {
    model = model || buildModel(task);

    const serviceClassName = truncateNamespace(task.className);
    const service = model.getService(serviceClassName);

    if (!service) {
      throw new Error(`[${serviceClassName}] service does not exist`);
    }

    const args = argsUtil.decode(task.arguments, model.classMappings);
    const context = task.invocationContextDto;

    applyUser(context.userId, context.userToken);

    const d = domain.create();
    d.on('error', reject);
    d.run(() => {
      Promise.resolve(service.invokeMethod(task.method, context, args))
        .then(res => (res !== undefined) ? res : null)
        .then(resolve)
        .catch(reject);
    });
  });
}

module.exports = execute;