var Coladay = artifacts.require("./Coladay.sol");

// test suite
contract('Coladay', function(accounts) {
    var coladayInstance;
    var manager = accounts[0];
    var user1 = accounts[1];
    var user2 = accounts[2];

    it("should not allow the owner of the contract to book a room", function() {
        return Coladay.deployed().then(function(instance){
            coladayInstance = instance;
            var slots = [];
            slots.push(web3.fromAscii("C0101"));
            return coladayInstance.bookSlots(slots, {from: manager});
        }).then(function(data) {
            assert.fail();
        }).catch(error => {
            assert.notEqual(error.message, "assert.fail()", "owner of the contract is not allowed to book a room");
        });
    });

    it("should book a room & return it", function() {
        return Coladay.deployed().then(function(instance){
            coladayInstance = instance;
            var slots = [];
            slots.push(web3.fromAscii("C0101"));
            return coladayInstance.bookSlots(slots, {from: user1});
        }).then(function() {
            return coladayInstance.getReservationFromUser(user1, 0);
        }).then(function(data) {
            assert.equal(web3.toAscii(data), "C0101", "The slot ID should be C0101");
        });
    });

    it("should book then cancel a reservation", function() {
        return Coladay.deployed().then(function(instance){
            coladayInstance = instance;
            var slots = [];
            slots.push(web3.fromAscii("C0101"));
            return coladayInstance.bookSlots(slots, {from: user1});
        }).then(function() {
            var slots = [];
            slots.push(web3.fromAscii("C0101"));
            return coladayInstance.cancelReservations(slots, {from: user1});
        }).then(function() {
            return coladayInstance.getUserReservationSize(user1);
        }).then(function(data) {
            assert.equal(data, 0, "length should be 0");
        });
    });

    it("should book a room with a slotID.length below 5", function() {
        return Coladay.deployed().then(function(instance){
            coladayInstance = instance;
            var slots = [];
            slots.push(web3.fromAscii("C0101extra"));
            return coladayInstance.bookSlots(slots, {from: user1});
        }).then(function() {
            return coladayInstance.getReservationFromUser(user1, 0);
        }).then(function(data) {
            assert.equal(web3.toAscii(data), "C0101", "The slot ID should be : C0101");
        });
    });
});
