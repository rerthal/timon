var util    = require('util');
var events  = require('events');
var thunky  = require('thunky');
var mongodb = require('mongodb');

util.inherits(Connection, events.EventEmitter);

Connection.mongodb = mongodb;

Connection.setDefaultConnection = function (conn) {
    this.defaultConnection = conn;
};

//TODO Make it private and provide methods to clear and get a connection
Connection.pool = [];

function Connection(connectionString) {
    'use strict';

    if (!(this instanceof Connection))
        return new Connection(connectionString);

    events.EventEmitter.call(this);

    this.connectionString = connectionString;

    Connection.pool.push(this);
}

Connection.prototype.connect = function ConnectionConnect(callback) {
    var self = this;

    this.connecting = true;

    this._getConnection = thunky(function (done) {
        mongodb.Db.connect(self.connectionString, function (err, db) {
            if (err) return done(err);

            self.db = db;
            db.on('error', function (err) { self.emit('error', err); });

            self.emit('ready');
            done(null, db);
        });
    });

    if (callback) this._getConnection(callback);

    return this;
};

Connection.prototype.whenConnected = function ConnectionGetConn(callback) {
    if (!this.connecting)
        return this.connect(callback);

    this._getConnection(callback);
};

module.exports = Connection;
