## Change Log

### v4.4.3 (2017/11/12)
- update dependencies (including backendless JS SDK)
- fix: 'call stack issue' when deploy service with circular dependencies in JSDOC
- add unhandled promise rejection printing to log
- PersistenceItem constructor now can accept string with objectId now
- PersistenceItem.find method works with plain object and simple 'where' strings
- add PersistenceItem.deleteRelation method
- add PersistenceItem.ref method convenient to minimize payload for model update requests

### v4.4.1 (2017/11/7)
- update dependencies

### v4.4.0 (2017/10/20)
- add static methods: count, save, bulkUpdate to PersistenceItem
- add saveWithRelations method to PersistenceItem
- PersistenceItem constructor now accepts arguments
- fix: undefined service path in model build output
- fix: geo points are not mapped to Backendless.GeoPoint
- Don't send relation props to server when saving PersistenceItem
- Don't send request to server if no props to save when saving PersistenceItem
- Always print business logic error stack to console during tasks execution (unless it's timeout error)
- print task execution time
- update Backendless JS SDK dependency to latest

### v4.3.6 (2017/09/21)
- Update Backendless JS SDK to version 4.0.10

### v4.3.5 (2017/09/19)
- Update Backendless Request to version 0.0.8
- No sandbox for Market Place business logic
- add bulkRemove and fetch methods to PersistenceItem

### v4.3.4 (2017/09/04)
- Apply current user id before service method execution

### v4.3.3 (2017/08/18)
- add missed `response` argument in `Users.afterFind` handler

### v4.3.2 (2017/08/11)
- add missed `response` argument in `Messaging.afterDeviceRegistration` handler

### v4.3.1 (2017/07/06)
- Change events handlers params
- Remove media events

### v4.3.0 (2017/07/04)
- Backendless Server v4.0 support (new communication protocol, deployment models)
- Service Methods may have specific route defined in a jsdoc `@route` tag. Route may include path params like `/order/{orderId}/item/{itemId}`
- Service and service methods description defined in jsdoc is visible in Backendless Dev Console
- In service method there is `this.request` containing the execution context including http path, headers, path params,
query params, user, user roles and so on
- Service constructor now accepts service config and execution context arguments
- Add `Backendless.Request` giving a possibility to make one liner http requests from BL
- userToken of a user originated the BL execution is now injected into every Backendless API call made from the BL
- fix invalid object references calculations during json parse if object contains `___dates___` meta fields
- decorate dates into `___dates___` metafields in a response to the server
- add `setRelation` and `addRelation` methods to `PersistenceItem` class
- add support for async service methods
- fix processing files whose names start with underscore
- Standalone work in `cloud` mode. CodeRunnerDriver is not required anymore.
- `app.files` config param was replaced by `app.exclude`. Coderunner now searches for all files in the current working
directory except those that matches `app.exclude` patterns
- add retry strategy for messages broker
- add `Backendless.ServerCode.Data` alias to `Backendless.ServerCode.Persistence`
- stop logs sending attempt for RAI tasks

### v1.11.0 (2017/02/20)
- add `Backendless.ServerCode.verbose()` method, giving a possibility to enable verbose logging mode

### v1.10.1 (2016/11/25)
- update Backendless SDK dependency to latest

### v1.9.1 (2016/11/22)
- resolve ___dates___ meta fields in server's JSON
- when critical error, exit with zero status code to avoid too noisy NPM complains

### v1.9.0 (2016/10/25)
- add `PRO` mode

### v1.8.0 (2016/08/17)
- in `CLOUD` mode the CodeRunner forwards all console logging 
(including CodeRunner task processing info) to `Backendless.Logging` which makes it possible to 
monitor deployed Business Logic
- When run in production, the CodeRunner now prints how much times it takes, to load a context specific 
business logic modules and their dependencies 

### v1.7.4 (2016/07/14)
- fix: `false` returned from service's method results in `null` result on client side

### v1.7.3 (2016/07/01)
- fix `HashMap cannot be cast to InvocationResult` error when invoking service method which returns non string value

### v1.7.2 (2016/06/14)
- change: same response shape for each task executors

### v1.7.1 (2016/06/08)
- fix `Can not parse generic service` error when publish service with third-party dependencies

### v1.7.0 (2016/06/01)
- show error line number in model summary output
- in 'verbose' mode print full stack trace of the module validation errors
- wrap a value returned from custom event handler into an object ({result: value})
except those cases where the value is already an object

### v1.6.0 (2016/05/25)
- multiple services is now allowed to deploy
- default service version is `1.0.0` (was `0.0.0`)

### v1.5.6 (2016/05/23)
- fix `timeout error` when custom event handler returns a `Function`
- fix publisher bug related to npm2 env and a module used by two other modules

### v1.5.5 (2016/05/16)
- update `eslint`, `backendless` to their latest versions
- fix `undefined` custom event name in model summary output
- remove redundant `(debug)` suffix from service name being registered for `debug`

### v1.5.4 (2016/04/28)
- fix `service not found` error in `cloud` mode
- increase server code parsing time in `cloud` mode

### v1.5.3 (2016/04/28)
- add temporary limitation to single service in deployment
- update `eslint`, `should`, `jszip` and `request` to their latest versions
- change service meta in the result of `PARSE-SERVICE` task as it is required by server
- make single call to api engine to register all debug services

### v1.5.2 (2016/04/28)
- optimize a list of dependencies included to the deployment in `npm3` env
- fix Runner can't find the code deployed from Windows machine

### v1.5.1 (2016/04/27)
- fix deployment does not include all dependencies in `npm3` env

### v1.5.0 (2016/04/27)
- update `backendless.js` to `v3.1.8`
- fix non-obvious error message (`handler not found`) that occurs in `cloud` mode at the time of script loading
- don't allow to deploy a server code that contains errors to production
- include all non dev dependencies into deployment zip
- print ServerCode error stack if run in verbose mode

### v1.4.2 (2016/04/25)
- fix `service not found` error in cloud mode
- make it possible to specify application files path pattern from command line
- in `debug` mode replace confusing service deployed message by service registered

### v1.4.1 (2016/04/25)
- update `backendless.js` dependency to `v3.1.7`

### v1.4.0 (2016/04/23)
- add support for services
- upgrade `redis` client to `v2.5.3`
- print more information about discovered business logic