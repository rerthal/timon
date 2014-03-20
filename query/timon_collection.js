var util   = require('util');
var mquery = require('mquery');

var base = mquery.Collection;
TimonCollection.__proto__ = base;

util.inherits(TimonCollection, base);

function TimonCollection(collection) {
    this.collection = collection;
}

TimonCollection.prototype.find = function (match, options, cb) {
    var self = this;
    base.prototype.find.call(self, match, options, function (err, docs) {
        if (err) { return cb(err); }

        return cb(null, docs.map(self.collection.serialize));
    });
};

TimonCollection.prototype.findOne = function (match, options, cb) {
    var self = this;
    base.prototype.findOne.call(self, match, options, function (err, doc) {
        if (err) { return cb(err); }

        return cb(null, self.collection.serialize.call(null, doc));
    });
};

TimonCollection.prototype.findAndModify = function (match, update, options, cb) {
    var self = this;
    base.prototype.findAndModify.call(self, match, options, function (err, doc) {
        if (err) { return cb(err); }

        return cb(null, self.collection.serialize.call(null, doc));
    });
};

module.exports = exports = TimonCollection;
