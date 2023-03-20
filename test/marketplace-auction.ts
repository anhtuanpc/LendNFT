import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Token, NFT, RLFAuction } from "../typechain-types";

describe("Marketplace Auction", function () {
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

    const MarketplaceContract = await ethers.getContractFactory("RLFAuction");
    const marketplaceContract: RLFAuction = await MarketplaceContract.deploy();

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

  describe("Basic auction methods", function () {
    it("Can make auction", async function () {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("10")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      const nftOwner = await nftContract.ownerOf("1");
      expect(nftOwner).is.equal(marketplaceContract.address);
    });

    it("Make invalid auction", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("10")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await expect(
        marketplaceContract
          .connect(bob)
          .createAuction(
            nftContract.address,
            "1",
            tokenContract.address,
            ethers.utils.parseEther("10"),
            ethers.utils.parseEther("9"),
            ethers.utils.parseEther("1"),
            startTime,
            ethers.BigNumber.from(startTime).add(1000000000000)
          )
      ).is.revertedWith("invalid ceiling price");
    });

    it("bid successfully", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));
      const contractTokenBalance = await tokenContract.balanceOf(
        marketplaceContract.address
      );

      expect(contractTokenBalance).to.equal(ethers.utils.parseEther("10"));
    });

    it("bid failed as not reach start time", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          ethers.BigNumber.from(startTime).add(500000000000),
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await expect(
        marketplaceContract
          .connect(alice)
          .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"))
      ).is.revertedWith("auction not start");
    });

    it("bid failed as auction stage is over", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          ethers.BigNumber.from(startTime).add(500000000000),
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await network.provider.send("evm_increaseTime", [1000000000000]);
      await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await expect(
        marketplaceContract
          .connect(alice)
          .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"))
      ).is.revertedWith("auction ended");
    });

    it("bid failed as lower min bid price", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("9"));
      await expect(
        marketplaceContract
          .connect(alice)
          .placeBid(nftContract.address, "1", ethers.utils.parseEther("9"))
      ).to.revertedWith("less than min bid price");
    });

    it("bid consecutive successfully", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await tokenContract.transfer(
        daniel.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));

      await tokenContract
        .connect(daniel)
        .approve(marketplaceContract.address, ethers.utils.parseEther("11"));
      await marketplaceContract
        .connect(daniel)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("11"));

      const aliceTokenBalance = await tokenContract.balanceOf(alice.address);
      const danielTokenBalance = await tokenContract.balanceOf(daniel.address);
      const marketplaceTokenBalance = await tokenContract.balanceOf(
        marketplaceContract.address
      );

      expect(aliceTokenBalance).to.equal(ethers.utils.parseEther("5000"));
      expect(danielTokenBalance).to.equal(ethers.utils.parseEther("4989"));
      expect(marketplaceTokenBalance).to.equal(ethers.utils.parseEther("11"));
    });

    it("bid consecutive failed as ", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await tokenContract.transfer(
        daniel.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("2"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));

      await tokenContract
        .connect(daniel)
        .approve(marketplaceContract.address, ethers.utils.parseEther("11"));
      await expect(
        marketplaceContract
          .connect(daniel)
          .placeBid(nftContract.address, "1", ethers.utils.parseEther("11"))
      ).to.revertedWith("less than min bid price");
    });

    it("end auction soon successfully", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(bob)
        .completeBid(nftContract.address, "1");
      const bobTokenBalance = await tokenContract.balanceOf(bob.address);
      const ownerTokenBalance = await tokenContract.balanceOf(owner.address);

      // check charge fee of user
      expect(bobTokenBalance).to.equal(ethers.utils.parseEther("9.5"));
      expect(ownerTokenBalance).to.equal(ethers.utils.parseEther("15000.5"));
    });

    it("end auction soon failed as not be the auction creator", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));
      await expect(
        marketplaceContract.connect(alice).completeBid(nftContract.address, "1")
      ).to.revertedWith("auction not ended or require owner for soon complete");
    });

    it("end auction soon as buy with ceiling price", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("1000"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("1000"));
      const bobTokenBalance = await tokenContract.balanceOf(bob.address);
      const ownerTokenBalance = await tokenContract.balanceOf(owner.address);

      expect(bobTokenBalance).to.equal(ethers.utils.parseEther("950"));
      expect(ownerTokenBalance).to.equal(ethers.utils.parseEther("15050"));
    });

    it("end auction successfully with buyer", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));

      await network.provider.send("evm_increaseTime", [1000000000000]);
      await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp
      await marketplaceContract
        .connect(alice)
        .completeBid(nftContract.address, "1");
      const bobTokenBalance = await tokenContract.balanceOf(bob.address);
      const ownerTokenBalance = await tokenContract.balanceOf(owner.address);

      // check charge fee of user
      expect(bobTokenBalance).to.equal(ethers.utils.parseEther("9.5"));
      expect(ownerTokenBalance).to.equal(ethers.utils.parseEther("15000.5"));
    });

    it("end auction successfully with owner", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));

      await network.provider.send("evm_increaseTime", [1000000000000]);
      await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp
      await marketplaceContract
        .connect(owner)
        .completeBid(nftContract.address, "1");
      const bobTokenBalance = await tokenContract.balanceOf(bob.address);
      const ownerTokenBalance = await tokenContract.balanceOf(owner.address);

      // check charge fee of user
      expect(bobTokenBalance).to.equal(ethers.utils.parseEther("9.5"));
      expect(ownerTokenBalance).to.equal(ethers.utils.parseEther("15000.5"));
    });

    it("end auction failed as not highest bidder", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(1000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("10"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("10"));

      await network.provider.send("evm_increaseTime", [1000000000000]);
      await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp
      await expect(
        marketplaceContract
          .connect(daniel)
          .completeBid(nftContract.address, "1")
      ).is.revertedWith("not creator, winner, or owner");
    });

    it("cancel auction failed as auction started", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          startTime,
          ethers.BigNumber.from(startTime).add(5000000000000)
        );

      await tokenContract
        .connect(alice)
        .approve(marketplaceContract.address, ethers.utils.parseEther("100"));
      await marketplaceContract
        .connect(alice)
        .placeBid(nftContract.address, "1", ethers.utils.parseEther("100"));
      await expect(
        marketplaceContract.connect(bob).cancelAuction(nftContract.address, "1")
      ).to.revertedWith("auction already started");
    });

    it("cancel auction successfully", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          ethers.BigNumber.from(startTime).add(1000000000000),
          ethers.BigNumber.from(startTime).add(5000000000000)
        );

      await marketplaceContract
        .connect(bob)
        .cancelAuction(nftContract.address, "1");
    });

    it("cancel auction successfully when it is over", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          ethers.BigNumber.from(startTime).add(1000000000000),
          ethers.BigNumber.from(startTime).add(5000000000000)
        );

      await network.provider.send("evm_increaseTime", [5000000000000]);
      await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp

      await marketplaceContract
        .connect(bob)
        .cancelAuction(nftContract.address, "1");
    });

    it("cancel auction failed as not auction creator", async () => {
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

      await tokenContract.transfer(
        alice.address,
        ethers.utils.parseEther("5000")
      );

      await nftContract.mint(bob.address, "1");

      await nftContract
        .connect(bob)
        .setApprovalForAll(marketplaceContract.address, true);

      const startTime = await marketplaceContract.getTime();

      await marketplaceContract
        .connect(bob)
        .createAuction(
          nftContract.address,
          "1",
          tokenContract.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("1"),
          ethers.BigNumber.from(startTime).add(1000000000000),
          ethers.BigNumber.from(startTime).add(5000000000000)
        );

      await expect(
        marketplaceContract
          .connect(alice)
          .cancelAuction(nftContract.address, "1")
      ).is.revertedWith("not auction creator");
    });
  });
});
