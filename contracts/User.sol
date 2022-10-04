// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./interfaces/IUser.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract User is IUser, baseContract {
    mapping(address => UserInfo) public userInfoOf;

    struct UserInfo {
        Level level;
        address refAddress;
        uint256 stakeRev;
        uint256 directRev;
        uint256 communityRev;
        uint256 contributionRev;
        uint256 achievementRev;
        uint256 performance;
        mapping(uint256 => uint256) refInfoOf;
    }

    constructor(address dbAddress) baseContract(dbAddress) {

    }

    function __User_init() public initializer {
        __baseContract_init();
        __User_init_unchained();
    }

    function __User_init_unchained() public onlyInitializing {
    }

    function refByMint(address refAddr, address userAddr) external {
        require(DBContract(DB_CONTRACT).ALYX_NFT() == _msgSender(), 'User: caller not the ALYX NFT.');

        // only new guy refable
        if (userInfoOf[userAddr].refAddress == address(0) && refAddr != address(0)) {
            userInfoOf[userAddr].refAddress = refAddr;

            userInfoOf[refAddr].refInfoOf[uint256(Level.elite)] += 1;
            auditLevel(refAddr);
        }
    }

    function auditLevel(address _userAddr) public {
        if (_userAddr != address(0)) {
            uint256 curLevelIndex = uint256(userInfoOf[_userAddr].level);
            if (curLevelIndex < uint256(type(Level).max)) {
                uint256 nextLevelIndex = curLevelIndex + 1;
                uint256 directRequire = DBContract(DB_CONTRACT).directRequirements(nextLevelIndex);
                uint256 performanceRequire = DBContract(DB_CONTRACT).performanceRequirements(nextLevelIndex);
                if (
                    userInfoOf[_userAddr].performance >= performanceRequire &&
                    userInfoOf[_userAddr].refInfoOf[curLevelIndex] >= directRequire
                ) {
                    userInfoOf[_userAddr].level = Level(nextLevelIndex);

                    address refAddress = userInfoOf[_userAddr].refAddress;
                    if (refAddress != address(0)) {
                        userInfoOf[refAddress].refInfoOf[nextLevelIndex] += 1;
                        auditLevel(refAddress);
                    }
                }
            }
        }
    }

}
