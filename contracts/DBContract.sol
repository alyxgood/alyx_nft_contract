// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./interfaces/IUser.sol";
import "./interfaces/ILYNKNFT.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract DBContract is OwnableUpgradeable {

    /**************************************************************************
     *****  Common fields  ****************************************************
     **************************************************************************/
    address immutable public USDT_TOKEN;

    address public LYNK_TOKEN;
    address public AP_TOKEN;
    address public STAKING;
    address public USER_INFO;
    address public LYNKNFT;
    address public STAKING_LYNKNFT;
    address public LISTED_LYNKNFT;
    address public MARKET;
    address public TEAM_ADDR;
    address public operator;

    /**************************************************************************
     *****  AlynNFT fields  ***************************************************
     **************************************************************************/
    uint256 public maxMintPerDayPerAddress;
    string public baseTokenURI;
    uint256[][] public attributeLevelThreshold;
    uint256 public mintLimitPerDay;

    /**************************************************************************
     *****  Market fields  ****************************************************
     **************************************************************************/
    bool public enableTokenWl;
    address[] public acceptTokens;
    uint256 public sellingLevelLimit;
    uint256 public tradingFee;

    /**************************************************************************
     *****  User fields  ******************************************************
     **************************************************************************/
    address public rootAddress;
    uint256[] public directRequirements;
    uint256[] public performanceRequirements;
    uint256[] public socialRewardRates;
    uint256 public contributionRewardThreshold;
    uint256[] public contributionRewardAmounts;
    uint256 public maxInvitationLevel;
    mapping(uint256 => uint256[]) public communityRewardRates;
    uint256 public achievementRewardLevelThreshold;
    uint256 public achievementRewardDurationThreshold;
    uint256[] public achievementRewardAmounts;

    /**************************************************************************
     *****  APToken fields  ***************************************************
     **************************************************************************/
    uint256[][] public sellingPackages;

    /**
     * @dev Throws if called by any account other than the operator.
     */
    modifier onlyOperator() {
        require(operator == _msgSender(), "DBContract: caller is not the operator");
        _;
    }

    constructor(address _usdtToken) {
        USDT_TOKEN = _usdtToken;
    }

    function __DBContract_init(address[] calldata _addresses) public initializer {
        __DBContract_init_unchained(_addresses);
        __Ownable_init();
    }

    function __DBContract_init_unchained(address[] calldata _addresses) private onlyInitializing {
        _setAddresses(_addresses);
    }

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
    }

    function setAddresses(address[] calldata _addresses) external onlyOperator {
        _setAddresses(_addresses);
    }


    /**************************************************************************
     *****  AlynNFT Manager  **************************************************
     **************************************************************************/
    function setMaxMintPerDayPerAddress(uint256 _maxMintPerDayPerAddress) external onlyOperator {
        maxMintPerDayPerAddress = _maxMintPerDayPerAddress;
    }

    function setBaseTokenURI(string calldata _baseTokenURI) external onlyOperator {
        baseTokenURI = _baseTokenURI;
    }

    function setMintLimitPerDay(uint256 _mintLimitPerDay) external onlyOperator {
        mintLimitPerDay = _mintLimitPerDay;
    }

    /**
     * CA: [100, 500, 1000 ... ]
     */
    function setAttributeLevelThreshold(ILYNKNFT.Attribute _attr, uint256[] calldata _thresholds) external onlyOperator {
        delete attributeLevelThreshold[uint256(_attr)];
        for (uint256 index; index < _thresholds.length; index++) {
            if (index > 0) {
                require(_thresholds[index] > _thresholds[index - 1], 'DBContract: invalid thresholds.');
            }
            attributeLevelThreshold[uint256(_attr)][index] = _thresholds[index];
        }
    }

    /**************************************************************************
     *****  Market Manager  ***************************************************
     **************************************************************************/
    function setAcceptToken(address _acceptToken) external onlyOperator {
        uint256 wlLength = acceptTokens.length;
        for (uint256 index; index < wlLength; index++) {
            if (_acceptToken == acceptTokens[index]) return;
        }

        acceptTokens.push(_acceptToken);
    }

    function removeAcceptToken(uint256 _index) external onlyOperator {
        uint256 wlLength = acceptTokens.length;
        if (_index < acceptTokens.length - 1)
            acceptTokens[_index] = acceptTokens[wlLength - 1];
        acceptTokens.pop();
    }

    function setSellingLevelLimit(uint256 _sellingLevelLimit) external onlyOperator {
        sellingLevelLimit = _sellingLevelLimit;
    }

    // e.g. 100% = 1e18
    function setTradingFee(uint256 _tradingFee) external onlyOperator {
        require(_tradingFee <= 1e18, 'DBContract: too large.');
        tradingFee = _tradingFee;
    }

    /**************************************************************************
     *****  User Manager  *****************************************************
     **************************************************************************/
    function setRootAddress(address _rootAddress) external onlyOperator {
        require(_rootAddress != address(0), 'DBContract: root cannot be zero address.');

        rootAddress = _rootAddress;
    }

    function setDirectRequirements(uint256[] calldata _requirements) external onlyOperator {
        require(_requirements.length == uint256(type(IUser.Level).max) + 1, 'DBContract: length mismatch.');

        delete directRequirements;
        for (uint256 index; index < _requirements.length; index++) {
            directRequirements[index] = _requirements[index];
        }
    }

    function setPerformanceRequirements(uint256[] calldata _requirements) external onlyOperator {
        require(_requirements.length == uint256(type(IUser.Level).max) + 1, 'DBContract: length mismatch.');

        delete performanceRequirements;
        for (uint256 index; index < _requirements.length; index++) {
            if (index > 0) {
                require(_requirements[index] > _requirements[index - 1], 'DBContract: invalid requirements.');
            }
            performanceRequirements[index] = _requirements[index];
        }
    }

    // e.g. 100% = 1e18
    function setSocialRewardRates(uint256[] calldata _rates) external onlyOperator {
        require(_rates.length == uint256(type(IUser.Level).max) + 1, 'DBContract: length mismatch.');

        delete socialRewardRates;
        for (uint256 index; index < _rates.length; index++) {
            require(_rates[index] <= 1e18, 'DBContract: too large.');
            socialRewardRates[index] = _rates[index];
        }
    }

    function setContributionRewardThreshold(uint256 _contributionRewardThreshold) external onlyOperator {
        contributionRewardThreshold = _contributionRewardThreshold;
    }

    function setContributionRewardAmounts(uint256[] calldata _amounts) external onlyOperator {
        require(_amounts.length == uint256(type(IUser.Level).max) + 1, 'DBContract: length mismatch.');

        delete contributionRewardAmounts;
        for (uint256 index; index < _amounts.length; index++) {
            contributionRewardAmounts[index] = _amounts[index];
        }
    }

    function setCommunityRewardRates(IUser.Level _level, uint256[] calldata _rates) external onlyOperator {
        uint256 levelUint = uint256(_level);

        delete communityRewardRates[levelUint];

        if (_rates.length > maxInvitationLevel) {
            maxInvitationLevel = _rates.length;
        }
        communityRewardRates[levelUint] = _rates;
    }

    function setAchievementRewardDurationThreshold(uint256 _achievementRewardDurationThreshold) external onlyOperator {
        achievementRewardDurationThreshold = _achievementRewardDurationThreshold;
    }

    function setAchievementRewardThresholdThreshold(uint256 _achievementRewardLevelThreshold) external onlyOperator {
        achievementRewardLevelThreshold = _achievementRewardLevelThreshold;
    }

    function setAchievementRewardAmounts(uint256[] calldata _amounts) external onlyOperator {
        require(_amounts.length == uint256(type(IUser.Level).max) + 1, 'DBContract: length mismatch.');

        delete achievementRewardAmounts;
        for (uint256 index; index < _amounts.length; index++) {
            achievementRewardAmounts[index] = _amounts[index];
        }
    }

    /**************************************************************************
     *****  APToken Manager  **************************************************
     **************************************************************************/
    function setSellingPackage(uint256[][] calldata _packages) external onlyOperator {
        delete sellingPackages;

        for (uint256 index; index < _packages.length; index++) {
            require(_packages[index].length == 3, 'DBContract: length mismatch.');
            sellingPackages[index] = _packages[index];
        }
    }

    /**************************************************************************
     *****  public view  ******************************************************
     **************************************************************************/
    function calcLevel(ILYNKNFT.Attribute _attr, uint256 _point) public view returns (uint256 level, uint256 overflow) {
        return _calcLevel(_attr, _point);
    }

    function acceptTokenLength() external view returns (uint256) {
        return acceptTokens.length;
    }

    function isAcceptToken(address _token) external view returns (bool) {
        uint256 wlLength = acceptTokens.length;
        for (uint256 index; index < wlLength; index++) {
            if (_token == acceptTokens[index]) return true;
        }

        return false;
    }

    function packageByIndex(uint256 _index) external view returns (uint256[] memory) {
        require(_index < sellingPackages.length, 'DBContract: index out of bounds.');

        return sellingPackages[_index];
    }

    function communityRewardRate(IUser.Level _level, uint256 _invitationLevel) external view returns (uint256) {
        if (communityRewardRates[uint256(_level)].length > _invitationLevel) {
            return communityRewardRates[uint256(_level)][_invitationLevel];
        }

        return 0;
    }

    function hasAchievementReward(uint256 _nftId) external view returns (bool) {
        uint256[] memory attrs = ILYNKNFT(LYNKNFT).nftInfoOf(_nftId);

        ILYNKNFT.Attribute maxAttr = type(ILYNKNFT.Attribute).max;
        (uint256 level, ) = _calcLevel(maxAttr, attrs[uint256(maxAttr)]);

        return level >= achievementRewardLevelThreshold;
    }

    function _calcLevel(ILYNKNFT.Attribute _attr, uint256 _point) private view returns (uint256 level, uint256 overflow) {
        uint256 thresholdLength = attributeLevelThreshold[uint256(_attr)].length;
        for (uint256 index; index < thresholdLength; index++) {
            if (_point > attributeLevelThreshold[uint256(_attr)][index]) {
                level = index + 1;
                overflow = _point - attributeLevelThreshold[uint256(_attr)][index];
            } else {
                break;
            }
        }
        return (level, overflow);
    }

    function _setAddresses(address[] calldata _addresses) private {
        require(_addresses.length == 10, 'DBContract: addresses length mismatch.');

        LYNK_TOKEN          = _addresses[0];
        AP_TOKEN            = _addresses[1];
        STAKING             = _addresses[2];
        LYNKNFT = _addresses[3];
        STAKING_LYNKNFT = _addresses[4];
        LISTED_LYNKNFT = _addresses[5];
        MARKET              = _addresses[6];
        USER_INFO           = _addresses[7];
        TEAM_ADDR           = _addresses[8];
    }

}
