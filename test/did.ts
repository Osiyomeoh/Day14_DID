import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre from "hardhat";
  
  describe("DecentralizedIdentity", function () {
    async function deployDIDFixture() {
      const [owner, addr1, addr2] = await hre.ethers.getSigners();
  
      const DecentralizedIdentity = await hre.ethers.getContractFactory("DecentralizedIdentity");
      const didContract = await DecentralizedIdentity.deploy();
  
      return { didContract, owner, addr1, addr2 };
    }
  
    describe("Identity Creation", function () {
      it("Should create a new identity", async function () {
        const { didContract, addr1 } = await loadFixture(deployDIDFixture);
  
        await expect(didContract.connect(addr1).createIdentity("sam"))
          .to.emit(didContract, "IdentityCreated")
          .withArgs(addr1.address, "sam");
  
        const identityOwner = await didContract.getIdentityOwner("sam");
        expect(identityOwner).to.equal(addr1.address);
      });
  
      it("Should not allow creating an identity with an existing name", async function () {
        const { didContract, addr1, addr2 } = await loadFixture(deployDIDFixture);
  
        await didContract.connect(addr1).createIdentity("Bob");
        await expect(didContract.connect(addr2).createIdentity("Bob")).to.be.revertedWith("Name already taken");
      });
  
      it("Should not allow creating multiple identities for the same address", async function () {
        const { didContract, addr1 } = await loadFixture(deployDIDFixture);
  
        await didContract.connect(addr1).createIdentity("sam");
        await expect(didContract.connect(addr1).createIdentity("AliceSecond")).to.be.revertedWith("Identity already exists");
      });
    });
  
    describe("Attribute Management", function () {
      async function createIdentityFixture() {
        const { didContract, addr1, addr2 } = await loadFixture(deployDIDFixture);
        await didContract.connect(addr1).createIdentity("sam");
        return { didContract, addr1, addr2 };
      }
  
      it("Should add an attribute", async function () {
        const { didContract, addr1 } = await loadFixture(createIdentityFixture);
  
        await expect(didContract.connect(addr1).addAttribute("email", "alice@example.com"))
          .to.emit(didContract, "AttributeAdded")
          .withArgs(addr1.address, "email", "alice@example.com");
  
        const attributeValue = await didContract.getAttribute(addr1.address, "email");
        expect(attributeValue).to.equal("alice@example.com");
      });
  
      it("Should update an attribute", async function () {
        const { didContract, addr1 } = await loadFixture(createIdentityFixture);
  
        await didContract.connect(addr1).addAttribute("email", "alice@example.com");
        await expect(didContract.connect(addr1).updateAttribute("email", "newalice@example.com"))
          .to.emit(didContract, "AttributeUpdated")
          .withArgs(addr1.address, "email", "newalice@example.com");
  
        const attributeValue = await didContract.getAttribute(addr1.address, "email");
        expect(attributeValue).to.equal("newalice@example.com");
      });
  
      it("Should remove an attribute", async function () {
        const { didContract, addr1 } = await loadFixture(createIdentityFixture);
  
        await didContract.connect(addr1).addAttribute("email", "alice@example.com");
        await expect(didContract.connect(addr1).removeAttribute("email"))
          .to.emit(didContract, "AttributeRemoved")
          .withArgs(addr1.address, "email");
  
        const attributeValue = await didContract.getAttribute(addr1.address, "email");
        expect(attributeValue).to.equal("");
      });
  
      it("Should not allow non-owners to modify attributes", async function () {
        const { didContract, addr1, addr2 } = await loadFixture(createIdentityFixture);
  
        await expect(didContract.connect(addr2).addAttribute("email", "alice@example.com")).to.be.revertedWith("Not the identity owner");
        await expect(didContract.connect(addr2).updateAttribute("email", "alice@example.com")).to.be.revertedWith("Not the identity owner");
        await expect(didContract.connect(addr2).removeAttribute("email")).to.be.revertedWith("Not the identity owner");
      });
    });
  
    describe("Identity Retrieval", function () {
      async function createIdentityWithAttributeFixture() {
        const { didContract, addr1 } = await loadFixture(deployDIDFixture);
        await didContract.connect(addr1).createIdentity("sam");
        await didContract.connect(addr1).addAttribute("email", "alice@example.com");
        return { didContract, addr1 };
      }
  
      it("Should retrieve the correct identity owner", async function () {
        const { didContract, addr1 } = await loadFixture(createIdentityWithAttributeFixture);
  
        const identityOwner = await didContract.getIdentityOwner("sam");
        expect(identityOwner).to.equal(addr1.address);
      });
  
      it("Should retrieve the correct attribute value", async function () {
        const { didContract, addr1 } = await loadFixture(createIdentityWithAttributeFixture);
  
        const attributeValue = await didContract.getAttribute(addr1.address, "email");
        expect(attributeValue).to.equal("alice@example.com");
      });
    });
  });