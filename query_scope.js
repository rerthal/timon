var mquery = require('mquery');
var Connection = require('./connection');

/**
 * Object that defines the scope of a query (find, update, remove, etc)
 */
function QueryScope(collectionName, connection, defaultScope) {
    var scoped;

    scoped = new mquery();

    if (defaultScope) scoped.where(defaultScope);

    scoped.exec = function () {
        var args = Array.prototype.slice.apply(arguments);
        var callback = args.pop();
        var hasCallback = ('function' !== typeof callback);

        var conn = (connection || Connection.defaultConnection);
        if (!conn) {
            var error = new Error('You must provide a mongodb connection');

            if (hasCallback) return callback(error);
            throw error;
        }

        conn.onReady(function onConnectionReady(err, db) {
            var readyScope = scoped.collection(db.collection(collectionName));
            mquery.prototype.exec.apply(readyScope, args.concat(callback));
        });
    };

    this.scoped = scoped;
}

module.exports = QueryScope;
