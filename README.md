# Validation plugin for Bookshelf ORM

Plugin built atop the <a href="https://www.npmjs.com/package/revalidator">revalidator</a> package
and <a href="http://tools.ietf.org/html/draft-zyp-json-schema-04">JSON Schema</a> compatible.

## Installation

### Install package

```bash
$ npm install bookshelf-revalidator
```

### Add plugin to Bookshelf instance

```javascript
// Setup Bookshelf
var knex = require('knex')(config.db);
var bookshelf = require('bookshelf')(knex);

// Add plugin
bookshelf.plugin(require('bookshelf-revalidator'));
```

## Using

### Add validation rules to model

```javascript
var Stuff = bookshelf.Model.extend({
  tableName: 'stuff',
  
  // Define validation rules
  rules: {
    name: { type: 'string', maxLength: 80, allowEmpty: false, required: true },
    gender: { enum: ['male', 'female'] },
    email: { format: 'email', maxLength: 40 },
    about: { type: ['string', 'null'] },
    last_visited: { type: 'object', conform: function(v) { return v instanceof Date }}
  }
  
});
```
For the full rules syntax see <a href="https://www.npmjs.com/package/revalidator#schema">revalidator docs</a>.

### Try to save model
```javascript
var stuff = new Stuff({ name: 'John', email: 'bad email' });
stuff.save()
  .then(function() {
    // All is ok, do something
  })
  .catch(Stuff.ValidationError, function(err) {
    // Validation error!
    console.error(stuff.errors); // or err.errors 
  })
  .done();
```

### Set only specific fields

Method below sets only attributes listed in the model rules. It can be useful to prevent DB error or to prevent setting of read-only attributes.

```javascript
var stuff = new Stuff();
stuff.setOnlyListed(req.body);
```
