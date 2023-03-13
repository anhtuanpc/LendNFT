// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    // structs and events
    constructor() ERC20("Token Test", "TK") {
        _mint(msg.sender, 20000 ether);
    }

    function mint(address _receiver, uint256 _amount) public {
        _mint(_receiver, _amount);
    }
}
