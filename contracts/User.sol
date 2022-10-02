// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "./baseContract.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract User is baseContract {

    enum Level {
        elite,
        epic,
        master,
        legendary,
        mythic,
        divine
    }

    mapping(address => RefInfo) public refInfo;
    mapping(address => UserInfo) public userInfo;

    struct RefInfo {
        uint32 eliteNum;
        uint32 epicNum;
        uint32 masterNum;
        uint32 legendaryNum;
        uint32 mythicNum;
        uint32 divineNum;
    }

    struct UserInfo {
        uint8 level;
        uint256 refAddress;
        uint256 stakeRev;
        uint256 directRev;
        uint256 communityRev;
        uint256 contributionRev;
        uint256 achievementRev;
    }

    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __User_init() public initializer {
        __baseContract_init();
        __User_init_unchained();
    }

    function __User_init_unchained() public onlyInitializing {
    }


}
