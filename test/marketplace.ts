import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Token, RLFMarketplace, NFT } from "../typechain-types";

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob, daniel, minter, approver] =
      await ethers.getSigners();

    const NFTContract = await ethers.getContractFactory("NFT");
    const nftContract: NFT = await NFTContract.deploy();

    const TokenContract = await ethers.getContractFactory("Token");
    const tokenContract: Token = await TokenContract.deploy();

    const MarketplaceContract = await ethers.getContractFactory(
      "RLFMarketplace"
    );
    const marketplaceContract: RLFMarketplace =
      await MarketplaceContract.deploy();

    return {
      owner,
      alice,
      bob,
      daniel,
      minter,
      approver,
      nftContract,
      tokenContract,
      marketplaceContract,
    };
  }

  describe("Deployment", function () {
    it("can offer token", async function () {
      const {
        owner,
        alice,
        bob,
        daniel,
        minter,
        approver,
        nftContract,
        tokenContract,
        marketplaceContract,
      } = await loadFixture(deployContracts);
      // expect(await lock.unlockTime()).to.equal(unlockTime);

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("10")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      await marketplaceContract
        .connect(bob)
        .putNftOnMarketplace(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("10")
      );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));

      await marketplaceContract
        .connect(alice)
        .makeOffer(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );
    });
  });
});
