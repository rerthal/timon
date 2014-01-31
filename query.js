var util   = require('util');
var events = require('events');

util.inherits(Query, events.EventEmitter);

Query.queue = [];
Query.setConnection = function (connection) {
    this.connection = connection;

    while (this.queue.length)
        this.queue.shift()(this.connection);
};

function Query(collectionName) {
    'use strict';

    if (!(this instanceof Query))
        return new Query(collectionName);

    this.scopeBuilder = QueryScope;
}

Query.prototype.withConnection = function QueryConnectionQueue(callback) {
    if (!Query.connection)
        return Query.queue.push(callback);

    process.nextTick(function () {
        callback(Query.connection);
    });
};

Query.prototype.findOne = function queryFindOne() {
    var self = this;

    return new this.scopeBuilder(function execFindOne(scope, callback) {
        self.withConnection(function (conn) {
            conn.findOne(scope.criteria, scope.fields, scope.options, callback);
        });
    });
};

module.exports = Query;

function QueryScope(onExec) {
    this.criteria = Object.create(null);
    this.fields   = Object.create(null);
    this.options  = Object.create(null);
    this.onExec   = onExec;

    this.append = {
        criteriaMapper: function (prefix, currentPath) {
            var path = (prefix ? (prefix + '.' + currentPath) : currentPath);

            if (!pathsMap[path])
                pathsMap[path] = {__operators__: []};

            return path;
        },

        // Creates a map of paths
        criteria: function (pathsMap, newCriteria) {
            for (var path in newCriteria) {
                path.split('.').reduce(this.criteriaMapper, '');

                for (var op in newCriteria[path]) {
                    if (newCriteria[path].hasOwnProperty(op)) {
                        pathsMap[path].__operators__.push(newCriteria[path][op]);
                    }
                }
            }

            return pathsMap;
        },

        // Just ovewrite
        object: function (original, properties) {
            for (var p in properties)
                if (properties.hasOwnProperty(p))
                    original[p] = properties[p];
        }
    };
}

QueryScope.prototype.filter = function (criteria) {
    this.append.criteria(this.criteria, criteria);
};

QueryScope.prototype.select = function (fields) {
    this.append.object(this.fields, fields);
};

QueryScope.prototype.options = function (opts) {
    this.append.object(this.options, opts);
};

QueryScope.prototype.done = function (callback) {
    var mongoCriteria = {};
    var checkifComparing = function (op) { return op.toString().test(/^[^$].+/); };
    var mapAsMongoCriteria = function (path) {
        return function (op) {
            var mapped = {};
            mapped[path] = op;
            return mapped;
        };
    };
    var operatorsToObject = function (reduced, op) {
        for (var key in op)
            if (op.hasOwnProperty(key))
                reduced[key] = op[key];

        return reduced;
    };

    for (var path in this.criteria) {
        var comparing = this.criteria[path].__operators__.some(checkifComparing);

        if (comparing) {
            mongoCriteria.$and = (mongoCriteria.$and || []);
            mongoCriteria.$and.concat(
                this.criteria[path].__operators__.map(mapAsMongoCriteria(path))
            );
        } else {
            var ops = this.criteria[path].__operators__.reduce(operatorsToObject, {});
            mongoCriteria[path] = ops;
        }
    }
};
