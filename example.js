/*examples*/
var Model = require('./index').Model;

var Person = new Model('Person', function (set) {
    'use strict';

    set({'property' : 'name', 'type' : String});
    set({'property' : 'age', 'type' : Number});
});

var Pet = new Model('Pet', function (set) {
    'use strict';

    set({'property' : 'name', 'type' : String});
    set({'property' : 'bornDate', 'type' : Date});
    set({'property' : 'owner', 'type' : Person});
    set({'property' : 'collar', 'type' : function (set) {
        set({'property' : 'color', 'type' : String});
    }});

    set({'property' : 'friends', 'type' : [function (set) {
        set({'property' : 'name', 'type' : String});

        this.greet = function () {
            console.log('Hi im ', this.name);
        };
    }]});

    set({'property' : 'contacts', 'type' : [String]});

    this.say = function (message) {
        console.log(this.name, 'says:', message);
    };
});

var Dog = new Pet.extend('Dog', function () {
    'use strict';

    this.bark = function () {
        this.say('Au Au!');
    };
});

var pluto;

pluto = new Dog({
    bornDate : new Date(),
    owner : {name : 'mickey'},
    collar : {color : 'red'}
});