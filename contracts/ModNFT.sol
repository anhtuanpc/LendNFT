// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract NFT is Initializable, OwnableUpgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable {
    // variables and mappings
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ROOT_OWNER = keccak256("ROOT_OWNER");

    string public baseTokenURI;

    // structs and events

    function initialize(string memory _name, string memory _symbol) public initializer {
        __Ownable_init();
        __ERC721Enumerable_init();
        __AccessControl_init();
        __ERC721_init(_name, _symbol);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    // function rootTransfer()


    function mint(address _receiver, uint256 _tokenId) public {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "[DUX-NFT]: Caller is not minter"
        );

        _mint(_receiver, _tokenId);
    }

    function mintBatch(address _receiver, uint256[] memory _tokenIds) public {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "[DUX-NFT]: Caller is not batch-minter"
        );

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            _mint(_receiver, _tokenIds[i]);
        }
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(ERC721EnumerableUpgradeable, AccessControlUpgradeable) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    // internal functions
        function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(ERC721Upgradeable.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        _beforeTokenTransfer(from, to, tokenId, 1);

        // Check that tokenId was not transferred by `_beforeTokenTransfer` hook
        require(ERC721Upgradeable.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");

        // Clear approvals from the previous owner
        delete _tokenApprovals[tokenId];

        unchecked {
            // `_balances[from]` cannot overflow for the same reason as described in `_burn`:
            // `from`'s balance is the number of token held, which is at least one before the current
            // transfer.
            // `_balances[to]` could overflow in the conditions described in `_mint`. That would require
            // all 2**256 token ids to be minted, which in practice is impossible.
            _balances[from] -= 1;
            _balances[to] += 1;
        }
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId, 1);
    }
}