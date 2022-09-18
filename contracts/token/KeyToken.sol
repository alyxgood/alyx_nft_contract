// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract KeyToken is ERC20PermitUpgradeable {

    function __KeyToken_init() public initializer {
        __KeyToken_init_unchained();
        __ERC20Permit_init("key_token");
        __ERC20_init("KEY", "key_token");
    }

    function __KeyToken_init_unchained() public onlyInitializing {
    }


}
