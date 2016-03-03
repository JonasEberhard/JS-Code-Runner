'use strict';

module.exports = function(Backendless) {

  class Order {
    constructor(items) {
      /**
       * @type {Array.<ShoppingItem>}
       */
      this.items = items;

      /**
       * @type {Number}
       */
      this.orderPrice = items.reduce((sum, item) => (sum || 0) + (item.price * item.quantity));
    }
  }

  class ShoppingCart {
    constructor() {
      this.items = [];
    }

    addItem(item) {
      this.items.push(item);
    }

    getItems() {
      return this.items;
    }
  }

  return Backendless.ServerCode.Service('ShoppingCart', {

    /**
     * @typedef {Object} ShoppingItem
     * @property {String} objectId
     * @property {String} product
     * @property {Number} price
     * @property {Number} quantity
     * */

    /**
     * @public
     * @param {String} cartName
     * @param {ShoppingItem} item
     * @returns {void}
     */
    addItem(cartName, item) {
      let shoppingCart = this.getCart(cartName);

      if (!shoppingCart) {
        shoppingCart = new ShoppingCart();
      }

      shoppingCart.addItem(item);
      item.objectId = null;

      Backendless.Cache.put(cartName, shoppingCart)
    },

    /**
     * @public
     * @param {String} cartName
     * @returns {Promise.<Order>}
     */
    purchase(cartName) {
      const shoppingCart = this.getCart(cartName);

      if (!shoppingCart) {
        throw new Error(`Shopping cart ${cartName} does not exist`);
      }

      const order = new Order(shoppingCart.getItems());

      return order.save()
        .then(() => {
          Backendless.Cache.delete(cartName);

          return order;
        })
    },

    /**
     * @private
     * @param {String} cartName
     * @returns {ShoppingCart}
     */
    getCart(cartName) {
      return Backendless.Cache.get(cartName, ShoppingCart.class);
    }
  });
};