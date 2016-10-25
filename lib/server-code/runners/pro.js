'use strict';

const cluster = require('cluster');
const Backendless = require('backendless');
const logger = require('../../util/logger');
const MessagesBroker = require('../services/messages-broker');
const tasksExecutor = require('./tasks/executor');
const promisify = require('../../util/promise').promisifyBackendless;
const consoleLogger = require('../../util/console-logger');
const promisifiedLogsFlush = promisify(Backendless.Logging.flush, Backendless.Logging);

const DRIVER_TASKS_CHANNEL = 'CODE_RUNNER_DRIVER';

const flushPendingLogs = () => {
  return promisifiedLogsFlush().catch(err => {
    logger.error('Error during logs flushing', err.message);
  });
};

process.on('uncaughtException', function(err) {
  console.log('Unhandled exception! ' + err.message + '/n' + err.stack);
});

const startMaster = opts => {
  const numCPUs = require('os').cpus().length;
  const workersCount = opts.workers || numCPUs;

  logger.info(`Starting Pro Code Runner with ${workersCount} workers...`);

  const startWorker = () => {
    const worker = cluster.fork();
    logger.info(`[${worker.process.pid}] Worker started`);
  };

  for (let i = 0; i < workersCount; i++) {
    startWorker();
  }

  cluster.on('exit', (worker) => {
    logger.info(`[${worker.process.pid}] Worker exited`);

    startWorker();
  });

  logger.info('Ready and waiting for Server Code tasks..');
};

const startWorker = opts => {
  process.title = 'Backendless CodeRunner Helper';

  logger.usePid = true;

  consoleLogger.attach();

  const messageBroker = new MessagesBroker(opts.backendless.msgBroker);
  messageBroker.on('error', err => {
    logger.error(err);
    process.exit(1);
  });

  const getTask = () => messageBroker.getTask(DRIVER_TASKS_CHANNEL);

  const processTask = task => {
    function sendResult(result) {
      logger.info('Processing finished');

      if (result) {
        logger.debug('Sending results to Redis');

        return messageBroker.setTaskResult(task.id, result)
          .then(() => logger.debug('Task results sent'));
      }
    }

    return tasksExecutor.execute(task, opts)
      .then(sendResult)
      .catch(err => logger.error(`Error during task execution. ${err.message || err}`));
  };

  return messageBroker.init()
    .then(getTask)
    .then(processTask)
    .then(flushPendingLogs)
    .catch(err => logger.error(err.message))
    .then(() => process.exit());
};

exports.start = function(opts) {
  if (cluster.isMaster) {
    return startMaster(opts);
  }

  return startWorker(opts);
};