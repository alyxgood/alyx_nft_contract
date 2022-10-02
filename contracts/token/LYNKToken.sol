// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract LYNKToken is ERC20PermitUpgradeable {

    function __LYNKToken_init() public initializer {
        __LYNKToken_init_unchained();
        __ERC20Permit_init("lynk_token");
        __ERC20_init("LYNK Token", "LYNK");
    }

    function __LYNKToken_init_unchained() public onlyInitializing {
    }


}
