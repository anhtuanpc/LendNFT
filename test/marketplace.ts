import { utils } from "ethers";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Token, RLFMarketplace, NFT } from "../typechain-types";

describe("Marketplace", function () {
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

  describe("All basic buy and sell nfts", function () {
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

    it("put on nft not own", async () => {
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

      await nftContract.setApprovalForAll(marketplaceContract.address, true);

      await expect(
        marketplaceContract.putNftOnMarketplace(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        )
      ).revertedWith("ERC721: invalid token ID");
    });

    it("buy nft with not enough token", async () => {
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

      await nftContract.mint(bob.address, "1");
      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("100")
      );

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("9"));

      await marketplaceContract
        .connect(bob)
        .putNftOnMarketplace(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );

      await expect(
        marketplaceContract.buy(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        )
      ).revertedWith("ERC20: insufficient allowance");
    });

    it("put on wrong nft", async () => {
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

      await nftContract.setApprovalForAll(marketplaceContract.address, true);

      await expect(
        marketplaceContract
          .connect(alice)
          .putNftOnMarketplace(
            nftContract.address,
            "1",
            tokenContract.address,
            ethers.utils.parseEther("10")
          )
      ).revertedWith("ERC721: invalid token ID");
    });

    it("buy nft successfully", async () => {
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

      await nftContract.mint(bob.address, "1");
      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("100")
      );

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));

      await marketplaceContract
        .connect(bob)
        .putNftOnMarketplace(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );

      await marketplaceContract
        .connect(alice)
        .buy(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );

      const nftOwner = await nftContract.ownerOf("1");
      expect(nftOwner).is.equal(alice.address);
    });

    it("offer un-list nft", async () => {
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

      await expect(
        marketplaceContract
          .connect(alice)
          .makeOffer(
            nftContract.address,
            "1",
            tokenContract.address,
            ethers.utils.parseEther("10")
          )
      ).revertedWith("not listed");
    });

    it("put right and wrong nft off marketplace", async () => {
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

      await nftContract.mint(alice.address, "1");
      await nftContract.mint(bob.address, "2");
      await nftContract
        .connect(alice)
        .setApprovalForAll(marketplaceContract.address, true);
      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      await marketplaceContract
        .connect(alice)
        .putNftOnMarketplace(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );

      await marketplaceContract
        .connect(bob)
        .putNftOnMarketplace(
          nftContract.address,
          "2",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );

      const nftOwnerAfterPutOn = await nftContract.ownerOf("1");
      expect(nftOwnerAfterPutOn).is.equal(marketplaceContract.address);

      await marketplaceContract
        .connect(alice)
        .putNftOffMarketplace(nftContract.address, "1");

      const nftOwnerAfterPutOff = await nftContract.ownerOf("1");
      expect(nftOwnerAfterPutOff).is.equal(alice.address);

      await expect(
        marketplaceContract
          .connect(alice)
          .putNftOffMarketplace(nftContract.address, "2")
      ).revertedWith("not listed owner");
    });

    it("make offer and other can cancel, accept offer", async () => {
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

      await nftContract.mint(alice.address, "1");
      await tokenContract.transfer(bob.address, ethers.utils.parseEther("100"));
      await nftContract
        .connect(alice)
        .setApprovalForAll(marketplaceContract.address, true);

      await marketplaceContract
        .connect(alice)
        .putNftOnMarketplace(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );
      await tokenContract
        .connect(bob)
        .approve(marketplaceContract.address, ethers.utils.parseEther("5"));

      await marketplaceContract
        .connect(bob)
        .makeOffer(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("5")
        );

      await expect(
        marketplaceContract
          .connect(daniel)
          .cancelOffer(nftContract.address, "1")
      ).revertedWith("not offerred nft");

      await expect(
        marketplaceContract
          .connect(daniel)
          .acceptOfferNFT(nftContract.address, "1", daniel.address)
      ).revertedWith("not offerred nft");

      await marketplaceContract
        .connect(bob)
        .cancelOffer(nftContract.address, "1");

      const bobTokenBalance = await tokenContract.balanceOf(bob.address);
      expect(bobTokenBalance).is.equal(ethers.utils.parseEther("100"));
    });

    it("accept offer with wrong offerer", async () => {
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

      await nftContract.mint(alice.address, "1");
      await tokenContract.transfer(bob.address, ethers.utils.parseEther("100"));
      await nftContract
        .connect(alice)
        .setApprovalForAll(marketplaceContract.address, true);

      await marketplaceContract
        .connect(alice)
        .putNftOnMarketplace(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10")
        );
      await tokenContract
        .connect(bob)
        .approve(marketplaceContract.address, ethers.utils.parseEther("5"));

      await marketplaceContract
        .connect(bob)
        .makeOffer(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("5")
        );

      await expect(
        marketplaceContract.acceptOfferNFT(
          nftContract.address,
          "1",
          daniel.address
        )
      ).revertedWith("not offerred nft");
    });
  });
});
