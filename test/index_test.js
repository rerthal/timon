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
});
