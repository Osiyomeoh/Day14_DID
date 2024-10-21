// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedIdentity {
    struct Identity {
        address owner;
        string name;
        uint256 creationDate;
        mapping(string => string) attributes;
    }

    mapping(address => Identity) public identities;
    mapping(string => address) public nameToAddress;

    event IdentityCreated(address indexed owner, string name);
    event AttributeAdded(address indexed owner, string key, string value);
    event AttributeUpdated(address indexed owner, string key, string value);
    event AttributeRemoved(address indexed owner, string key);

    modifier onlyIdentityOwner() {
        require(identities[msg.sender].owner == msg.sender, "Not the identity owner");
        _;
    }

    function createIdentity(string memory _name) public {
        require(identities[msg.sender].owner == address(0), "Identity already exists");
        require(nameToAddress[_name] == address(0), "Name already taken");

        Identity storage newIdentity = identities[msg.sender];
        newIdentity.owner = msg.sender;
        newIdentity.name = _name;
        newIdentity.creationDate = block.timestamp;

        nameToAddress[_name] = msg.sender;

        emit IdentityCreated(msg.sender, _name);
    }

    function addAttribute(string memory _key, string memory _value) public onlyIdentityOwner {
        require(bytes(identities[msg.sender].attributes[_key]).length == 0, "Attribute already exists");
        identities[msg.sender].attributes[_key] = _value;
        emit AttributeAdded(msg.sender, _key, _value);
    }

    function updateAttribute(string memory _key, string memory _value) public onlyIdentityOwner {
        require(bytes(identities[msg.sender].attributes[_key]).length > 0, "Attribute does not exist");
        identities[msg.sender].attributes[_key] = _value;
        emit AttributeUpdated(msg.sender, _key, _value);
    }

    function removeAttribute(string memory _key) public onlyIdentityOwner {
        require(bytes(identities[msg.sender].attributes[_key]).length > 0, "Attribute does not exist");
        delete identities[msg.sender].attributes[_key];
        emit AttributeRemoved(msg.sender, _key);
    }

    function getAttribute(address _owner, string memory _key) public view returns (string memory) {
        return identities[_owner].attributes[_key];
    }

    function getIdentityOwner(string memory _name) public view returns (address) {
        return nameToAddress[_name];
    }
}