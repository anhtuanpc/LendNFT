// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealToken is ERC20, Ownable {
    // structs and events
    constructor() ERC20("Real Token", "REAL") {
        _mint(_msgSender(), 20000 ether);
    }

    function mint(address _receiver, uint256 _amount) public onlyOwner {
        _mint(_receiver, _amount);
    }

    function burn(address _burner, uint256 _amount) public {
        _burn(_burner, _amount);
    }
}