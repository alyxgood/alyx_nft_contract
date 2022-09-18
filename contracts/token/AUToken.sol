// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AUToken is ERC20PermitUpgradeable {

    function __KeyToken_init() public initializer {
        __AUToken_init_unchained();
        __ERC20Permit_init("au_token");
        __ERC20_init("AU", "au_token");
    }

    function __AUToken_init_unchained() public onlyInitializing {
    }


}
