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

    // Apply proxies
    scoped.exec = whenConnected('exec', connection);
    scoped.count = whenConnected('count', connection);

    this.scoped = scoped;
}

module.exports = QueryScope;

function whenConnected(op, connection) {
    return function QueryScopeWhenConnectedProxy() {
        var args = Array.prototype.slice.apply(arguments);
        var callback = args.pop();
        var hasCallback = ('function' === typeof callback);

        var scoped = this;

        if (scoped._collection) {
            scoped[op].apply(args.concat(callback));
        } else {
            connection.whenConnected(function withConnection(err, db) {
                if (err && hasCallback) { return callback(err); }

                scoped
                .collection(db.collection(collectionName))
                [op].apply(args.concat(callback));
            });
        }
    };
}
