'use strict';


require('util').inherits(ValidationError, Error);

function ValidationError(message) {
  this.name = 'ValidationError';
  this.message = message || 'Invalid data';
}


module.exports = function(bookshelf) {

  var _ = require('lodash');
  var revalidator = require('revalidator');

  var proto = bookshelf.Model.prototype;

  var Model = bookshelf.Model.extend({

    constructor: function() {
      proto.constructor.apply(this, arguments);
      var self = this;
      this.on('creating', function() {
        if (!self.validate(true)) throw new Model.ValidationError();
      });
      this.on('updating', function() {
        if (!self.validate()) throw new Model.ValidationError();
      });
    },

    // See https://www.npmjs.com/package/revalidator#schema
    rules: {},

    // Last validation errors
    errors: [],

    // Required = true for insert, false for update
    validate: function(required) {
      var result = revalidator.validate(
        this.attributes,
        this._getJsonSchema(required),
        { cast: true }
      );
      this.errors = result.errors;
      return result.valid;
    },

    // Sets only listed in rules attributes
    setOnlyListed: function(attributes) {
      var rules = this.rules;
      var safeAttributes = _.reduce(attributes, function(result, value, key) {
        if (rules.hasOwnProperty(key)) {
          result[key] = value;
        }
        return result;
      }, {});

      return this.set(safeAttributes);
    },

    _getJsonSchema: function(required) {
      var rules = _.cloneDeep(this.rules);
      if (!required) {
        _.each(rules, function(rule) {
          if (rule.required) delete(rule.required);
        });
      }
      return { properties: rules };
    }

  }, {

    // Static property with exception class
    ValidationError: ValidationError

  });

  bookshelf.Model = Model;

};

