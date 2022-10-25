// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../baseContract.sol";
import "../interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract LYNKToken is ERC20PermitUpgradeable, baseContract, IERC20Mintable {

    constructor(address dbAddress) baseContract(dbAddress) { }

    function __LYNKToken_init() public initializer {
        __LYNKToken_init_unchained();
        __ERC20Permit_init("LYNK Token");
        __ERC20_init("LYNK Token", "LYNK");
    }

    function __LYNKToken_init_unchained() public onlyInitializing {
    }

    function mint(address account, uint256 amount) external onlyUserOrStakingContract {
        _mint(account, amount);
    }

}
