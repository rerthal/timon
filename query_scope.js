var mquery = require('mquery');
var Connection = require('./connection');

/**
 * Object that defines the scope of a query (find, update, remove, etc)
 */
function QueryScope(collectionName, connection, defaultScope) {
    if (!connection) {
        throw new TypeError('You must provide a mongodb connection');
    }

    var scoped;

    scoped = new mquery();

    if (defaultScope) scoped.where(defaultScope);

    // Apply dalayed proxies
    scoped.exec = whenConnected(scoped.exec, collectionName, connection);
    scoped.count = whenConnected(scoped.count, collectionName, connection);

    this.scoped = scoped;
}

module.exports = QueryScope;

function whenConnected(fn, collectionName, connection) {
    return function QueryScopeWhenConnectedProxy() {
        var args = Array.prototype.slice.apply(arguments);
        var callback = args.pop();
        var hasCallback = (typeof callback === 'function');

        var context;
        var scoped = this;

        if (scoped._collection) {
            fn.apply(scoped, args.concat(callback));
        } else {
            connection.whenConnected(function withConnection(err, db) {
                if (err && hasCallback) { return callback(err); }

                scoped.collection(db.collection(collectionName));
                fn.apply(scoped, args.concat(callback));
            });
        }
    };
}
