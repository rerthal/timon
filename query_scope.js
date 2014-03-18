var mquery = require('mquery');

/**
 * Object that defines the scope of a query (find, update, remove, etc)
 */
function QueryScope(model, collectionName, connection, defaultScope) {
    if (!connection) {
        throw new TypeError('You must provide a mongodb connection');
    }

    var scoped;

    scoped = new mquery();

    if (defaultScope) scoped.where(defaultScope);

    // Apply dalayed proxies
    scoped.find             = whenConnected(scoped.find,             collectionName, connection);
    scoped.findOne          = whenConnected(scoped.findOne,          collectionName, connection);
    scoped.count            = whenConnected(scoped.count,            collectionName, connection);
    scoped.distinct         = whenConnected(scoped.distinct,         collectionName, connection);
    scoped.update           = whenConnected(scoped.update,           collectionName, connection);
    scoped.remove           = whenConnected(scoped.remove,           collectionName, connection);
    scoped.findOneAndUpdate = whenConnected(scoped.findOneAndUpdate, collectionName, connection);
    scoped.findOneAndRemove = whenConnected(scoped.findOneAndRemove, collectionName, connection);
    scoped.exec             = whenConnected(scoped.exec,             collectionName, connection);

    scoped.loadFromDB = function (doc) { return new model(doc); };

    this.model = model;
    this.scoped = scoped;
}

module.exports = QueryScope;

function whenConnected(fn, collectionName, connection) {
    return function QueryScopeWhenConnectedProxy() {
        var scoped = this;
        var args = Array.prototype.slice.apply(arguments);

        var callback = args.pop();
        var hasCallback = (typeof callback === 'function');

        if (!hasCallback) { //TODO check if is allowed (unsafe update, etc)
            return this;
        }

        connection.whenConnected(function withConnection(err, db) {
            if (err) { return callback(err); }

            scoped.collection(db.collection(collectionName));

            var isFind = {find: 1, findOne: 1, findOneAndUpdate: 1, findOneAndRemove: 1}[scoped.op];

            if (isFind) {
                fn.apply(scoped, args.concat(function findModel() {
                    var err, docs, callbackArgs;
                    callbackArgs = Array.prototype.slice.apply(arguments);
                    err = callbackArgs.shift();
                    docs = callbackArgs.shift();

                    if (err) { return callback(err); }

                    if (Array.isArray(docs)) {
                        docs = docs.map(scoped.loadFromDB);
                    } else if (docs) {
                        docs = scoped.loadFromDB(docs);
                    }

                    callback.apply(null, [err].concat([docs], callbackArgs));
                }));
            } else {
                fn.apply(scoped, args.concat(callback));
            }
        });
    };
}
