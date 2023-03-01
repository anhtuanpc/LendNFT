// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721Enumerable, Ownable {
    // structs and events
    string public baseTokenURI;

    constructor() ERC721("TEST", "TEST") {}

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function mint(address _receiver, uint256 _tokenId) public {
        _mint(_receiver, _tokenId);
    }

    function mintBatch(address _receiver, uint256[] memory _tokenIds) public {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            _mint(_receiver, _tokenIds[i]);
        }
    }
}