// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Market is baseContract {

    constructor(address dbAddress) baseContract(dbAddress) {

    }

    function __Market_init() public initializer {
        __baseContract_init();
        __Market_init_unchained();
    }

    function __Market_init_unchained() private onlyInitializing {
    }

    function listNFT(uint256 _tokenId, address _token, uint256 _amount) external {

    }

}
