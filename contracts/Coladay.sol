pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Coladay
 * @dev allow users to book a room during the ColaDay
 * A slot (ex: C0105) is defined by:
 * - the name of the company ("C" or "P")
 * - the ID of the room (from 01 to 10)
 * - the hour (08 to 18)
 */
contract Coladay is Ownable {

    struct User {
        bytes5[] slotsReserved; // ex: "C0105" where C = coca, 01: room number, 05: timeSlot)
        mapping(bytes5 => uint) positionFromSlotId; // to find a slotId in the array
        bool activated;
    }

    mapping(address => User) private userBase;
    mapping(bytes5 => address) private userFromSlotId; // to know who has reserved a slot

    bytes5[] private allSlotsReserved;
    mapping(bytes5 => uint) private allPositionFromSlotId;

    event bookEvent(bytes5 slotId);
    event cancelEvent(bytes5 slotId);

    constructor() public {
    }

    modifier isUser {
        require(!isOwner());
        _;
    }

    /*
     * @dev display the number of slots reserved
     */
    function getAllReservationsSize() external view returns(uint) {
        return allSlotsReserved.length;
    }

    /*
     * @dev display the slot Id according to a possition from the allSlotsReserved[] array
     */
    function getReservation(uint _pos) external view returns(bytes5) {
        return allSlotsReserved[_pos];
    }

    /*
     * @dev allow a user to book several slots (room & hour) from a company
     */
    function bookSlots(bytes5[] _slotsId) external isUser {
        // user can only book 110 slot max in a row (all company's rooms for the day)
        if(_slotsId.length > 110) {
            return;
        }

        for(uint i = 0; i < _slotsId.length; i++) {
            if(userFromSlotId[_slotsId[i]] != address(0) || _slotsId[i].length > 5) {
                return;
            }

            // update the main registry
            userFromSlotId[_slotsId[i]] = msg.sender;
            uint _mainPosition = allSlotsReserved.push(_slotsId[i]) -1;
            allPositionFromSlotId[_slotsId[i]] = _mainPosition;

            // update the user registry
            uint _position = userBase[msg.sender].slotsReserved.push(_slotsId[i]) - 1;
            userBase[msg.sender].positionFromSlotId[_slotsId[i]] = _position;

            emit bookEvent(_slotsId[i]);
        }
    }

    /*
     * @dev display the number of slots reserved by a user
     */
    function getUserReservationSize(address _address) external view returns(uint) {
        return (userBase[_address].slotsReserved.length);
    }

    /*
     * @dev provide the slot Id of a user according to a position from the user.slotsReserved[] array
     */
    function getReservationFromUser(address _address, uint _pos) external view returns(bytes5) {
        return (userBase[_address].slotsReserved[_pos]);
    }

    /*
     * @dev remove slot from user internal registry & from main registry
     */
    function cancelReservations(bytes5[] _slotsId) external isUser {
        for(uint i = 0; i < _slotsId.length; i++) {

            // verifying if the slot is already empty or is booked by someone else
            if(userFromSlotId[_slotsId[i]] == address(0) || userFromSlotId[_slotsId[i]] != msg.sender) {
                return;
            }

            // main database
            uint _mainPosition = allPositionFromSlotId[_slotsId[i]];

            if(allSlotsReserved.length == 1 || _mainPosition == allSlotsReserved.length - 1) {
                // just delete the only or last slot
                delete allSlotsReserved[_mainPosition];
            } else {
                // delete the slot by overwriting it with the last slot
                bytes5 _mainSlotIdToMove = allSlotsReserved[allSlotsReserved.length - 1];
                allSlotsReserved[_mainPosition] = _mainSlotIdToMove;
                allPositionFromSlotId[_mainSlotIdToMove] = _mainPosition;
            }

            delete userFromSlotId[_slotsId[i]];
            delete allPositionFromSlotId[_slotsId[i]];
            allSlotsReserved.length--;

            // user database
            uint _position = userBase[msg.sender].positionFromSlotId[_slotsId[i]];

            if(userBase[msg.sender].slotsReserved.length == 1 || _position == userBase[msg.sender].slotsReserved.length - 1) {
                // just delete the only or last slot
                delete userBase[msg.sender].slotsReserved[_position];
            } else {
                // delete the slot by overwriting it with the last slot
                bytes5 slotIdToMove = userBase[msg.sender].slotsReserved[userBase[msg.sender].slotsReserved.length - 1];
                userBase[msg.sender].slotsReserved[_position] = slotIdToMove;
                userBase[msg.sender].positionFromSlotId[slotIdToMove] = _position;
            }

            delete userBase[msg.sender].positionFromSlotId[_slotsId[i]];
            userBase[msg.sender].slotsReserved.length--;

            emit cancelEvent(_slotsId[i]);
        }
    }

    function() public {}
}
