import { RealToken } from "./../typechain-types/contracts/RealToken";
import { utils } from "ethers";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Token, RLFMarketplace, NFT } from "../typechain-types";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";

describe("Marketplace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob, daniel, minter, approver] =
      await ethers.getSigners();
    const TokenContract = await ethers.getContractFactory("RealToken");
    const tokenContract: RealToken = await TokenContract.deploy();
    return {
      owner,
      alice,
      bob,
      daniel,
      minter,
      approver,
      tokenContract,
    };
  }

  describe("Test TOKEN", function () {
    it("mint successfully", async function () {
      const { owner, alice, bob, daniel, minter, approver, tokenContract } =
        await loadFixture(deployContracts);

      await tokenContract.mint(owner.address, ethers.utils.parseEther("1000"));

      const balance = await tokenContract.balanceOf(owner.address);

      expect(balance).is.equal(ethers.utils.parseEther("21000"));
    });

    it("burn successfully", async function () {
      const { owner, alice, bob, daniel, minter, approver, tokenContract } =
        await loadFixture(deployContracts);

      await tokenContract.burn(owner.address, ethers.utils.parseEther("10000"));

      const balance = await tokenContract.balanceOf(owner.address);

      expect(balance).is.equal(ethers.utils.parseEther("10000"));
    });

    it("cannot mint over total supply", async function () {
      const { owner, alice, bob, daniel, minter, approver, tokenContract } =
        await loadFixture(deployContracts);
      // expect(await lock.unlockTime()).to.equal(unlockTime);

      await expect(
        tokenContract.mint(
          owner.address,
          ethers.utils.parseEther("10000000000000")
        )
      ).is.revertedWith("[RLF]: Exceed maximum token amount");
    });
  });
});
