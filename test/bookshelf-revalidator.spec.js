'use strict';

var _ = require('lodash');
var should = require('should');


describe('bookshelf-revalidator', function() {

  // Setup
  var knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: __dirname + '/test.db'
    }
  });

  var bookshelf = require('bookshelf')(knex);

  bookshelf.plugin(require('../bookshelf-revalidator'));


  describe('validate()', function() {

    var Stuff = bookshelf.Model.extend({
      tableName: 'stuff',
      rules: {
        name: {type: 'string', maxLength: 80, allowEmpty: false, required: true},
        email: {type: ['string', 'null'], format: 'email', maxLength: 40}
      }
    });

    it('should validate ok', function() {
      var stuff = new Stuff({email: 'foo@example.com'});
      stuff.validate().should.be.true;
      stuff.errors.should.be.eql([]);
    });

    it('should validate fail', function() {
      var stuff = new Stuff({email: 'foo'});
      stuff.validate().should.be.false;
      stuff.errors.should.have.lengthOf(1);
      stuff.errors[0].should.be.eql({
        attribute: 'format',
        property: 'email',
        expected: 'email',
        actual: 'foo',
        message: 'is not a valid email'
      });
    });

    it('should validate only passed attributes', function () {
      var stuff = new Stuff({email: 'foo@example.com'});
      stuff.validate().should.be.true;
    });

    it('should require attributes', function() {
      var stuff = new Stuff({email: 'john@example.com'});
      stuff.validate(true).should.be.false;
      stuff.errors.should.have.lengthOf(1);
      stuff.errors[0].attribute.should.be.equal('required');
      //_.every(stuff.errors, 'attribute', 'required').should.be.true;
    });

    it('should validate on insert', function(done) {
      var stuff = new Stuff({ email: 'john@example.com' });
      stuff.save()
        .then(function() {
          throw new Error('Should throw ValidationError');
        })
        .catch(Stuff.ValidationError, function() {
          done();
        })
        .done();
    });

    //it('should validate on update', function(done) {
    //  var stuff = new Stuff({ email: 'john@example.com' });
    //  stuff.save()
    //    .then(function() {
    //      throw new Error('Should throw ValidationError');
    //    })
    //    .catch(Stuff.ValidationError, function() {
    //      done();
    //    })
    //    .done();
    //});

    it('should ignore non-existent attributes on save', function(done) {
      var stuff = new Stuff();
      stuff.safeSet({ name: 'Peter', badattr: 100 });
      should(stuff.attributes).be.eql({ name: 'Peter' });
      done();
    });

    //it.skip('should ignore format if value is null', function() {
    //  var stuff = new Stuff({ email: null });
    //  var result = stuff.validate();
    //  console.log(stuff.errors);
    //  result.should.be.true;
    //});

  });

});
