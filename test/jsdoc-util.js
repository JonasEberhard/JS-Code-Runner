'use strict';

const jsdoc       = require('../lib/util/jsdoc'),
      definitions = require('./helpers/definitions'),
      assert      = require('assert');

require('mocha');

function toMap(classes) {
  const map = {};

  classes.forEach(clazz => {
    if (map[clazz.name]) {
      throw new Error('Duplicate Class found');
    }

    map[clazz.name] = clazz;
  });

  return map;
}

describe('jsdoc util', function() {
  it('should detect and explain classes in file', function() {
    const classes = jsdoc.describeClasses('test/fixtures/shopping-cart.js');
    const classesMap = toMap(classes);

    assert.equal(classes.length, 4);

    assert.deepEqual(classesMap.Order, definitions.ORDER);
    assert.deepEqual(classesMap.ShoppingCart, definitions.SHOPPING_CART);
    assert.deepEqual(classesMap.ShoppingCartService, definitions.SHOPPING_CART_SERVICE);
    assert.deepEqual(classesMap.ShoppingItem, definitions.SHOPPING_ITEM);
  });
});