var mquery = require('mquery');
var TimonCollection = require('./timon_collection');

mquery.Collection = TimonCollection;

/**
 * Object that defines the scope of a query (find, update, remove, etc)
 */
function Query(model, collectionName, connection, defaultScope) {
    if (!connection) {
        throw new TypeError('You must provide a mongodb connection');
    }

    var scoped;

    scoped = new mquery();

    if (defaultScope) {
        scoped.where(defaultScope);
    }

    var collection = new CollectionWrapper(collectionName, connection);
    collection.serialize = function (doc) {
        return new model(doc);
    };

    scoped.collection(collection);

    this.scoped = scoped;
}

function CollectionWrapper(name, connection) {
    var method, methods;

    methods = mquery.BaseCollection.methods;
    for (var i = 0; i < methods.length; i++) {
        method = methods[i];
        this[method] = wrapped(method);
    }

    function wrapped(methodName) {
        return function wrappedMethod() {
            var args = arguments;
            var callback = arguments[arguments.length - 1];
            if (typeof callback !== 'function') {
                throw new Error('"' + methodName + '" must receive a callback function');
            }

            connection.whenConnected(function (err, db) {
                var collection = db.collection(name);

                collection[methodName].apply(collection, args);
            });
        };
    }
}

module.exports = exports = Query;
