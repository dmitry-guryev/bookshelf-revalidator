'use strict';

var _ = require('lodash');
var should = require('should');


describe('bookshelf-revalidator', function() {

  // Setup
  var knex = require('knex')({
    client: 'pg',
    connection: 'postgres://localhost/test'
  });

  var bookshelf = require('bookshelf')(knex);

  bookshelf.plugin(require('../bookshelf-revalidator'));


  describe('validate()', function() {

    var rules = {
      user_id: {type: 'integer'},
      name: {type: 'string', maxLength: 80, allowEmpty: false, required: true},
      type: {enum: ['single', 'regular', 'transactional'], required: true},
      personalized: {type: 'boolean', required: true},
      from_email: {type: ['string', 'null'], format: 'email', maxLength: 40},
      data: {type: 'object'},
      single_schedule: {
        conform: function (v) {
          return v instanceof Date
        }
      }
    };
    var Stuff = bookshelf.Model.extend({
      tableName: 'stuff',
      rules: rules
    });

    it('should validate ok', function() {
      var stuff = new Stuff({from_email: 'foo@example.com'});
      stuff.validate().should.be.true;
      stuff.errors.should.be.eql([]);
    });

    it('should validate fail', function() {
      var stuff = new Stuff({from_email: 'foo'});
      stuff.validate().should.be.false;
      stuff.errors.should.have.lengthOf(1);
      stuff.errors[0].should.be.eql({
        attribute: 'format',
        property: 'from_email',
        expected: 'email',
        actual: 'foo',
        message: 'is not a valid email'
      });
    });

    it('should validate only passed attributes', function () {
      var stuff = new Stuff({from_email: 'foo@example.com'});
      stuff.validate().should.be.true;
    });

    it('should require attributes', function() {
      var stuff = new Stuff({name: 'John', data: {foo: 'bar'}});
      stuff.validate(true).should.be.false;
      stuff.errors.should.have.lengthOf(2); // 3 required fields, 1 is passed
      _.every(stuff.errors, 'attribute', 'required').should.be.true;
    });

    it('should validate unknown attribute', function() {
      var stuff = new Stuff({ nonexistent: 100500 });
      stuff.validate().should.be.false;
      stuff.errors.should.have.lengthOf(1);
      stuff.errors[0].should.be.eql({
        attribute: 'additionalProperties',
        property: 'nonexistent',
        expected: undefined,
        actual: 100500,
        message: 'must not exist'
      });
    });

    it('should validate on insert', function(done) {
      var stuff = new Stuff({ name: 'John' });
      stuff.save()
        .then(function() {
          throw new Error('Should throw ValidationError');
        })
        .catch(Stuff.ValidationError, function() {
          done();
        })
        .done();
    });

    it('should validate on update', function(done) {
      var stuff = new Stuff({ name: 'John' });
      stuff.save()
        .then(function() {
          throw new Error('Should throw ValidationError');
        })
        .catch(Stuff.ValidationError, function() {
          done();
        })
        .done();
    });

    it('should ignore non-existent attributes on save', function(done) {
      var stuff = new Stuff();
      stuff.safeSet({ name: 'Peter', badattr: 100 });
      should(stuff.attributes).be.eql({ name: 'Peter' });
      done();
    });

    //it.skip('should ignore format if value is null', function() {
    //  var stuff = new Stuff({ from_email: null });
    //  var result = stuff.validate();
    //  console.log(stuff.errors);
    //  result.should.be.true;
    //});

  });

});
