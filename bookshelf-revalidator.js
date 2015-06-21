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

    // Описание properties в формате JSON Schema
    // см. https://www.npmjs.com/package/revalidator
    // Важно: должен описывать все атрибуты, которые можно устанавливать,
    // а read-only поля типа created_at, updated_at здесь лучше не указывать
    rules: {},

    // Сюда валидатор кладет ошибки валидации
    errors: [],

    // Required = true для insert, false для update
    validate: function(required) {
      var result = revalidator.validate(
        this.attributes,
        this._getJsonSchema(required),
        { cast: true }
      );
      this.errors = result.errors;
      return result.valid;
    },

    // Устанавливает только те атрибуты, которые
    safeSet: function(attributes) {
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

