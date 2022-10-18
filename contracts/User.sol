// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./interfaces/IUser.sol";
import "./interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
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
        mapping(uint256 => uint256) refCounterOf;
    }

    struct StakeInfo {
        uint256 lastUpdateTime;
        uint256 stakedDuration;
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

    function register(address _refAddr) external {
        require(
            userInfoOf[_msgSender()].refAddress == address(0) ||
            _msgSender() == DBContract(DB_CONTRACT).rootAddress(),
                'User: already register.'
        );
        require(
            userInfoOf[_refAddr].refAddress != address(0) ||
            _refAddr == DBContract(DB_CONTRACT).rootAddress(),
                'User: the ref not a valid ref address.'
        );

        userInfoOf[_msgSender()].refAddress = _refAddr;
        userInfoOf[_refAddr].refCounterOf[0] += 1;
        auditLevel(_refAddr);
    }

    function isValidUser(address _userAddr) view external returns (bool) {
        return userInfoOf[_userAddr].refAddress != address(0);
    }

    function hookByUpgrade(address _userAddr, uint256 _performance) onlyLYNKNFTContract nonReentrant external {
        if (_performance > 0) {
            address _refAddr = userInfoOf[_userAddr].refAddress;
            uint256 refPerformance = userInfoOf[_refAddr].performance;
            uint256 refLevel = uint256(userInfoOf[_refAddr].level);

            uint256 amount;
            // distribute social reward
            uint256 rate = DBContract(DB_CONTRACT).socialRewardRates(refLevel);
            amount = (_performance * (10 ** IERC20MetadataUpgradeable(DBContract(DB_CONTRACT).LYNK_TOKEN()).decimals()) * rate) / 1e18;
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

            userInfoOf[_refAddr].performance += _performance;
            auditLevel(_refAddr);
        }
    }

    function hookByStake(uint256[] calldata _nftIds) onlyStakingContract nonReentrant external {
        for (uint256 index; index < _nftIds.length; index++) {
            uint256 nftId = _nftIds[index];
            if (DBContract(DB_CONTRACT).hasAchievementReward(nftId)) {
                stakeNFTs[nftId].lastUpdateTime = block.timestamp;
            }
        }
    }

    function hookByUnStake(uint256[] calldata _nftIds) onlyStakingContract nonReentrant external {
        for (uint256 index; index < _nftIds.length; index++) {
            uint256 nftId = _nftIds[index];
            if (DBContract(DB_CONTRACT).hasAchievementReward(nftId)) {
                uint256 lastUpdateTime = stakeNFTs[nftId].lastUpdateTime;
                stakeNFTs[nftId].lastUpdateTime = block.timestamp;
                stakeNFTs[nftId].stakedDuration += block.timestamp - lastUpdateTime;
            }
        }
    }

    function hookByClaimReward(address _userAddr, uint256 _rewardAmount) onlyStakingContract nonReentrant external {
        address curAddr = userInfoOf[_userAddr].refAddress;
        address lynkAddr = DBContract(DB_CONTRACT).LYNK_TOKEN();
        uint256 maxInvitationLevel = DBContract(DB_CONTRACT).maxInvitationLevel();
        for (uint256 index; index < maxInvitationLevel; index++) {
            if (curAddr == address(0)) break;

            uint256 rate = DBContract(DB_CONTRACT).communityRewardRate(userInfoOf[curAddr].level, index);
            if (rate > 0) {
                uint256 reward = rate * _rewardAmount / 1e18;

                userInfoOf[curAddr].communityRev += reward;
                IERC20Mintable(lynkAddr).mint(curAddr, reward);
            }

            curAddr = userInfoOf[curAddr].refAddress;
        }
    }

    function claimAchievementReward(uint256[] calldata _nftIds) nonReentrant external {
        address LYNKNFTAddress = DBContract(DB_CONTRACT).LYNKNFT();
        address bLYNKNFTAddress = DBContract(DB_CONTRACT).STAKING_LYNKNFT();

        for (uint256 index; index < _nftIds.length; index++) {
            require(
                IERC721Upgradeable(LYNKNFTAddress).ownerOf(_nftIds[index]) == _msgSender() ||
                IERC721Upgradeable(bLYNKNFTAddress).ownerOf(_nftIds[index]) == _msgSender(),
                    'User: not the owner.'
            );
        }
        (bool[] memory claimable, uint256 rewardAmount) = _calcAchievementReward(_msgSender(), _nftIds);

        require(rewardAmount > 0, 'User: cannot claim 0.');
        for (uint256 index; index < _nftIds.length; index++) {
            if (claimable[index]) {
                stakeNFTs[_nftIds[index]].stakedDuration = 0;
                stakeNFTs[_nftIds[index]].lastUpdateTime = block.timestamp;
            }
        }

        userInfoOf[_msgSender()].achievementRev += rewardAmount;
        IERC20Mintable(DBContract(DB_CONTRACT).AP_TOKEN()).mint(_msgSender(), rewardAmount);
    }

    function calcAchievementReward(address _userAddr, uint256[] calldata _nftIds) external view returns (bool[] memory, uint256) {
        return _calcAchievementReward(_userAddr, _nftIds);
    }

    function auditLevel(address _userAddr) private {
        if (_userAddr != address(0)) {
            uint256 curLevelIndex = uint256(userInfoOf[_userAddr].level);
            if (curLevelIndex < uint256(type(Level).max)) {
                uint256 nextLevelIndex = curLevelIndex + 1;
                uint256 directRequire = DBContract(DB_CONTRACT).directRequirements(curLevelIndex);
                uint256 performanceRequire = DBContract(DB_CONTRACT).performanceRequirements(curLevelIndex);
                if (
                    userInfoOf[_userAddr].performance >= performanceRequire &&
                    userInfoOf[_userAddr].refCounterOf[curLevelIndex] >= directRequire
                ) {
                    userInfoOf[_userAddr].level = Level(nextLevelIndex);

                    address refAddress = userInfoOf[_userAddr].refAddress;
                    if (refAddress != address(0)) {
                        userInfoOf[refAddress].refCounterOf[nextLevelIndex] += 1;
                        auditLevel(refAddress);
                    }
                }
            }
        }
    }

    function _calcAchievementReward(address _userAddr, uint256[] calldata _nftIds) private view returns (bool[] memory, uint256) {
        uint256 durationThreshold = DBContract(DB_CONTRACT).achievementRewardDurationThreshold();
        uint256 rewardAmount = DBContract(DB_CONTRACT).achievementRewardAmounts(uint256(userInfoOf[_userAddr].level));

        bool[] memory claimable = new bool[](_nftIds.length);
        uint256 rewardTotalAmount;
        for (uint256 index; index < _nftIds.length; index++) {
            if (DBContract(DB_CONTRACT).hasAchievementReward(_nftIds[index])) {
                uint256 duration = block.timestamp - stakeNFTs[_nftIds[index]].lastUpdateTime;
                if (stakeNFTs[_nftIds[index]].stakedDuration + duration >= durationThreshold) {
                    claimable[index] = true;
                    rewardTotalAmount += rewardAmount;
                }
            }
        }

        return (claimable, rewardTotalAmount);
    }

    function refCounterOf(address _userAddr, Level _level) external view returns (uint256) {
        return userInfoOf[_userAddr].refCounterOf[uint256(_level)];
    }

}
