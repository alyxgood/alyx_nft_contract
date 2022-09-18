// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "./baseContract.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract User is baseContract {

    struct USER_INFO {
        uint8 level;
        uint256 addr;
        uint256 communityRev;
        uint256 directRev;
        uint256 stakeRev;
    }

    mapping(address => USER_INFO) public userInfo;
    // address -> address
    mapping(address => address) public parent;


    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __User_init() public initializer {
        __baseContract_init();
        __User_init_unchained();
    }

    function __User_init_unchained() public onlyInitializing {
    }


}
