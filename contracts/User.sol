// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./interfaces/IUser.sol";
import "./interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract User is IUser, ReentrancyGuardUpgradeable, baseContract {
    mapping(address => UserInfo) public userInfoOf;

    struct UserInfo {
        Level level;
        address refAddress;
        uint256 stakeRev;
        uint256 socialRev;
        uint256 communityRev;
        uint256 contributionRev;
        uint256 achievementRev;
        uint256 performance;
        mapping(uint256 => uint256) refInfoOf;
    }

    constructor(address dbAddress) baseContract(dbAddress) {

    }

    function __User_init() public initializer {
        __ReentrancyGuard_init();
        __baseContract_init();
        __User_init_unchained();
    }

    function __User_init_unchained() public onlyInitializing {
    }

    function hookByBuyNFT(address _refAddr, address _userAddr) onlyMarketContract external {
        _refCommon(_refAddr, _userAddr);
    }

    function hookByBuyAPToken(address _refAddr, address _userAddr) onlyApTokenContract external {
        _refCommon(_refAddr, _userAddr);
    }

    function hookByMint(address _refAddr, address _userAddr)  onlyALYXContract external {
        _refCommon(_refAddr, _userAddr);
    }

    function hookByUpgrade(address _refAddr, address _userAddr, uint256 _performance) onlyALYXContract nonReentrant external {
        bool auditNeed = false;
        if (userInfoOf[_userAddr].refAddress == address(0) && _refAddr != address(0)) {
            userInfoOf[_userAddr].refAddress = _refAddr;

            for (uint256 index; index <= uint256(userInfoOf[_userAddr].level); index++) {
                userInfoOf[_refAddr].refInfoOf[index] += 1;
            }
            auditNeed = true;
        }
        if (_performance > 0) {
            _refAddr = userInfoOf[_userAddr].refAddress;
            uint256 refPerformance = userInfoOf[_refAddr].performance;
            uint256 refLevel = uint256(userInfoOf[_refAddr].level);

            uint256 amount;
            // distribute social reward
            uint256 rate = DBContract(DB_CONTRACT).socialRewardRates(refLevel);
            amount = _performance * rate / 1e18;
            userInfoOf[_refAddr].socialRev += amount;
            IERC20Mintable(DBContract(DB_CONTRACT).LYNK_TOKEN()).mint(_refAddr, amount);

            // distribute contribution reward
            uint256 threshold = DBContract(DB_CONTRACT).contributionRewardThreshold();
            if (threshold > 0) {
                amount = (((refPerformance + _performance) / threshold) - (refPerformance / threshold)) * DBContract(DB_CONTRACT).contributionRewardAmounts(refLevel);
                if (amount > 0) {
                    IERC20Mintable(DBContract(DB_CONTRACT).AP_TOKEN()).mint(_refAddr, amount);
                }
            }

            if (_refAddr != address(0)) {
                userInfoOf[_refAddr].performance += _performance;
                auditNeed = true;
            }
        }
        if (auditNeed) {
            auditLevel(_refAddr);
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

    function _refCommon(address _refAddr, address _userAddr) private {
        if (userInfoOf[_userAddr].refAddress == address(0) && _refAddr != address(0)) {
            userInfoOf[_userAddr].refAddress = _refAddr;

            for (uint256 index; index <= uint256(userInfoOf[_userAddr].level); index++) {
                userInfoOf[_refAddr].refInfoOf[index] += 1;
            }
            auditLevel(_refAddr);
        }
    }

}
