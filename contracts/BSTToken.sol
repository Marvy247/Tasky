// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BSTToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000_000 * 10 ** 6; // 1 trillion with 6 decimals
    bool public paused;

    error ContractPaused();
    error MaxSupplyReached();
    error InvalidAmount();

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    constructor() ERC20("Strade Token", "BST") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000_000_000 * 10 ** 6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address recipient, uint256 amount) external onlyOwner whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyReached();
        _mint(recipient, amount);
    }

    function burn(uint256 amount) external whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        _burn(msg.sender, amount);
    }

    function pause() external onlyOwner { paused = true; }
    function unpause() external onlyOwner { paused = false; }
}
