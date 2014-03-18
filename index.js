var events = require('events');
var util   = require('util');
var inflect = require('inflection-extended');
var QueryScope = require('./query_scope');
var Connection = require('./connection');

var Property, Model, connection;

function connect(mongoURI, callback) {
    connection = new Connection(mongoURI);

    Connection.setDefaultConnection(connection);

    if (callback) connection.connect(callback);
}

exports.connect = connect;

Property = function PropertyConstructor (instance, data, options) {
    'use strict';

    var self;

    self          = this;
    self.name     = options.property;
    self.type     = options.type instanceof Array ? options.type[0] : options.type;
    self.neasted  = self.type instanceof Function && [String, Boolean, Number, Date].indexOf(self.type) === -1;
    self.embed    = options.type instanceof Array;
    self.original = data[self.name];

    if (self.neasted && !self.type.isModel) {
        self.type = new Model(null, self.type);
    }

    self.refresh = function PropertyRefresh () {
        if (self.embed) {
            self.get();
            data[self.name] = [];
            for (var i = 0; i < self.value.length; i += 1) {
                data[self.name][i] = self.value[i].serialize();
            }
        } else if (self.neasted) {
            data[self.name] = self.value.serialize();
        } else {
            data[self.name] = self.value;
        }
    };

    self.get = function PropertyGet () {
        if (self.embed) {
            for (var i = 0; i < self.value.length; i += 1) {
                if (self.value[i] && !(self.value[i] instanceof self.type)) {
                    if (self.neasted || self.type === Date) {
                        self.value[i] = new self.type(self.value[i]);
                    } else if ([String, Boolean, Number].indexOf(self.type) > -1) {
                        self.value[i] = self.type(self.value[i]);
                    }
                }
            }
        }
        return self.value;
    };

    self.set = function PropertySet (value) {
        if (self.embed) {
            self.value = value || [];
        } else if (self.neasted && value instanceof self.type) {
            self.value = value;
        } else if (self.neasted) {
            self.value = new self.type(value || {});
        } else if ([String, Boolean, Number].indexOf(self.type) > -1) {
            self.value = value ? self.type(value) : null;
        } else if (self.type === Date) {
            self.value = value ? new self.type(value) : null;
        } else {
            self.value = value;
        }
    };

    self.set(data[self.name]);

    if (!options['private']) {
        instance.__defineSetter__(self.name, self.set);
        instance.__defineGetter__(self.name, self.get);
    }
};

exports.Property = Property;

Model = function ModelConstructor (name, constructor, parent, options) {
    'use strict';

    var model;

    model = function EntityConstructor (data) {
        var instance, properties;

        instance = this;
        properties = [];
        events.EventEmitter.call(this);

        this.serialize = function EntityRefresh () {
            for (var i = 0; i < properties.length; i += 1) {
                properties[i].refresh();
            }
            return data;
        };

        this.save = function EntitySave () {
            return this.serialize();
        };

        this.remove = function EntityRemove () {

        };

        if (parent) {
            parent.apply(this, [data]);
        }

        constructor.apply(this, [function (options) {
            var property;

            property = new Property(instance, data, options);
            properties.push(property);
            return {'get' : property.get, 'set' : property.set};
        }]);
    };

    model.__defineGetter__('isModel', function () {
        return true;
    });

    model.extend = function ModelExtend (name, constructor) {
        return new Model(name, constructor, model);
    };

    if (name) {
        // If inheriting models, define default scope as discriminator
        //TODO Make discriminator property changable (not only _type)
        var defaultScope = (parent ? {_type: name} : null);
        var query = new QueryScope(inflect(name).underscore().pluralize().value(), Connection.defaultConnection, defaultScope);
        model.scoped = query.scoped;
    }

    util.inherits(model, events.EventEmitter);

    return model;
};

exports.Model = Model;
