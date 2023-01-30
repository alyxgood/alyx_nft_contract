// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../baseContract.sol";
import "../interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract ALYXToken is ERC20PermitUpgradeable, OwnableUpgradeable, baseContract, IERC20Mintable {

    constructor(address dbAddress) baseContract(dbAddress) { }

    function __ALYXToken_init() public initializer {
        __ALYXToken_init_unchained();
        __ERC20Permit_init("ALYX Token");
        __ERC20_init("ALYX Token", "ALYX");
        __baseContract_init();
    }

    function __ALYXToken_init_unchained() private {
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

}
