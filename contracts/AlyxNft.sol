// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "./baseContract.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AlyxNft is ERC721EnumerableUpgradeable,baseContract {

    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __KeyToken_init() public initializer {
        __AlyxNft_init_unchained();
        __ERC721Enumerable_init();
        __ERC721_init("AlyxNft","AlyxNft");
        __baseContract_init();
    }

    function __AlyxNft_init_unchained() public onlyInitializing {
    }
}
