// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

abstract contract baseContract is ContextUpgradeable {

   address immutable public  DB_CONTRACT;

    constructor(address dbContract) {
        DB_CONTRACT = dbContract;
    }
    function __baseContract_init() public initializer {
        __Context_init();
    }

}
