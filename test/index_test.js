/* jshint -W030 */
var mongodb = require('mongodb');
var timon = require('../');

var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('timon', function () {
    before(function () { this.mongo = 'mongodb://localhost/timon_test'; });

    it('exports only Property, Model and connect functions', function () {
        expect(timon).to.have.keys(['connect', 'Property', 'Model']);
    });

    describe('.connect()', function () {
        beforeEach(function () { sinon.spy(mongodb.Db, 'connect'); });
        afterEach(function () { mongodb.Db.connect.restore(); });

        it('does not connect to database when no callback is given', function () {
            timon.connect(this.mongo);
            expect(mongodb.Db.connect).to.not.have.been.called;
        });

        it('tries to connect to database when given a callback function', function () {
            timon.connect(this.mongo, function () { });
            expect(mongodb.Db.connect).to.have.been.calledOnce;
        });

        it('returns a Connection object', function () {
            var connection = timon.connect(this.mongo);
            expect(connection.constructor.name).to.be.eql('Connection');
        });
    });

    describe('Model', function () {
        // Connect to mongo
        before(function (done) {
            mongodb.MongoClient.connect(this.mongo, function (err, db) {
                done(err, this.db = db);
            }.bind(this));
        });
        after(function () { this.db.close(); });

        function DogConstructor(set) {
            set({property: 'name', type: String});
            this.bark = function () { return 'woof!'; };
        }

        function PugConstructor(set) {
            this.bark = function () { return 'pugs goes woof!'; };
        }

        before(function () { this.model = new timon.Model('Dog', DogConstructor); });

        beforeEach(function (done) {
            this.db.collection('dogs').insert({name: 'Pluto'}, done);
        });
        afterEach(function (done) {
            this.db.collection('dogs').remove({}, done);
        });

        describe('#scoped()', function () {
            it('returns a plain scoped query object', function () {
                var scoped = this.model.scoped();
                expect(scoped._conditions).to.be.eql({});
            });

            it('returns a scope with discriminator described', function () {
                var subModel = this.model.extend('subModel', function () { });
                var subScoped = subModel.scoped();

                expect(subScoped._conditions).to.be.eql({_type: 'subModel'});
            });

            it('serializes from database as model', function (done) {
                var DogModel = this.model;
                this.model.scoped().where('name').equals('Pluto').findOne(function (err, dog) {
                    if (err) { return done(err); }

                    expect(dog).to.be.an.instanceof(DogModel);
                    done();
                });
            });
        });
    });
});
