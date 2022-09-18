// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "./baseContract.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Market is baseContract {

    constructor(address  dbAddress) baseContract(dbAddress){

    }

    function __Market_init() public initializer {
        __baseContract_init();
        __Market_init_unchained();
    }

    function __Market_init_unchained() public onlyInitializing {
    }


}
