// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BoosterToken is ERC20PermitUpgradeable {

    function __BoosterToken_init() public initializer {
        __BoosterToken_init_unchained();
        __ERC20Permit_init("booster_token");
        __ERC20_init("BP", "booster_token");
    }

    function __BoosterToken_init_unchained() public onlyInitializing {
    }


}
