// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./interfaces/IUser.sol";
import "./interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract User is IUser, ReentrancyGuardUpgradeable, baseContract {

    mapping(address => UserInfo) public userInfoOf;
    mapping(uint256 => StakeInfo) public stakeNFTs;

    struct UserInfo {
        Level level;
        address refAddress;
        uint256 stakeRev;
        uint256 socialRev;
        uint256 communityRev;
        uint256 contributionRev;
        uint256 achievementRev;
        uint256 performance;
        uint256[] levelUpTime;
        mapping(uint256 => uint256) refInfoOf;
    }

    struct StakeInfo {
        bool isDone;
        uint256 remainTime;
        uint256 lastUpdateTime;
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

    function hookByStake(uint256[] calldata nftIds) onlyStakingContract nonReentrant external {
        uint256 achievementRewardDuration = DBContract(DB_CONTRACT).achievementRewardDuration();

        for (uint256 index; index < nftIds.length; index++) {
            uint256 nftId = nftIds[index];
            if (DBContract(DB_CONTRACT).hasAchievementReward(nftId)) {
                if (!stakeNFTs[nftId].isDone) {
                    stakeNFTs[nftId].lastUpdateTime = block.timestamp;
                    if (stakeNFTs[nftId].remainTime == 0) {
                        stakeNFTs[nftId].remainTime = achievementRewardDuration;
                    }
                }
            }
        }
    }

    function hookByUnStake(address _userAddr, uint256[] calldata nftIds) onlyStakingContract nonReentrant external {
        uint256 reward = _calcAchievementReward(_userAddr, nftIds);
        IERC20Mintable(DBContract(DB_CONTRACT).AP_TOKEN()).mint(_userAddr, reward);
    }

    function hookByClaimReward(address _userAddr, uint256 _rewardAmount) onlyStakingContract nonReentrant external {
        address curAddr = userInfoOf[_userAddr].refAddress;
        address lynkAddr = DBContract(DB_CONTRACT).LYNK_TOKEN();
        uint256 maxInvitationLevel = DBContract(DB_CONTRACT).maxInvitationLevel();
        for (uint256 index; index < maxInvitationLevel; index++) {
            uint256 rate = DBContract(DB_CONTRACT).communityRewardRate(userInfoOf[curAddr].level, index);
            if (rate > 0) {
                uint256 reward = rate * _rewardAmount / 1e18;

                userInfoOf[curAddr].communityRev += reward;
                IERC20Mintable(lynkAddr).mint(curAddr, reward);
            }

            curAddr = userInfoOf[curAddr].refAddress;
        }
    }

    function claimAchievementReward(uint256[] calldata nftIds) nonReentrant external {
        address bAlyxNFTAddress = DBContract(DB_CONTRACT).STAKING_ALYX_NFT();

        for (uint256 index; index < nftIds.length; index++) {
            require(IERC721Upgradeable(bAlyxNFTAddress).ownerOf(nftIds[index]) == _msgSender(), 'User: not the owner.');
        }

        uint256 reward = _calcAchievementReward(_msgSender(), nftIds);
        IERC20Mintable(DBContract(DB_CONTRACT).AP_TOKEN()).mint(_msgSender(), reward);
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
                        userInfoOf[refAddress].levelUpTime.push(block.timestamp);
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

    function _calcAchievementReward(address _userAddr, uint256[] calldata nftIds) private returns (uint256) {
        uint256 rewardDuration = DBContract(DB_CONTRACT).achievementRewardDuration();
        uint256[] memory levelUpTime = userInfoOf[_userAddr].levelUpTime;
        uint256[] memory achievementRewardAmounts = DBContract(DB_CONTRACT).getAchievementRewardAmounts();

        uint256 reward;
        for (uint256 indexNftId; indexNftId < nftIds.length; indexNftId++) {
            uint256 remainTime = stakeNFTs[nftIds[indexNftId]].remainTime;
            if (remainTime > 0) {
                uint256 duration;
                uint256 lastUpdateTime = stakeNFTs[nftIds[indexNftId]].lastUpdateTime;
                for (uint256 indexLevel; indexLevel < levelUpTime.length; indexLevel++) {
                    if (lastUpdateTime < levelUpTime[indexLevel]) {
                        duration = levelUpTime[indexLevel] - lastUpdateTime;
                        if (duration > remainTime) duration = remainTime;
                        reward += (duration * achievementRewardAmounts[indexLevel + 1]) / rewardDuration;

                        remainTime -= duration;
                        lastUpdateTime = levelUpTime[indexLevel];
                    }
                }

                duration = block.timestamp - lastUpdateTime;
                if (duration > remainTime) duration = remainTime;
                reward += (duration * achievementRewardAmounts[uint256(userInfoOf[_userAddr].level)]) / rewardDuration;

                stakeNFTs[nftIds[indexNftId]].remainTime = (remainTime- duration);
                stakeNFTs[nftIds[indexNftId]].lastUpdateTime = block.timestamp;
                stakeNFTs[nftIds[indexNftId]].isDone = (remainTime - duration == 0);
            }
        }

        return reward;
    }

}
