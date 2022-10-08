// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./interfaces/IUser.sol";
import "./interfaces/IAlyxNFT.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract DBContract is OwnableUpgradeable {

    /**************************************************************************
     *****  Common fields  ****************************************************
     **************************************************************************/
    address immutable public USDT_TOKEN;
    address immutable public LYNK_TOKEN;
    address immutable public AP_TOKEN;
    address immutable public KEY_TOKEN;
    address immutable public STAKING;
    address immutable public USER_INFO;
    address immutable public ALYX_NFT;
    address immutable public STAKING_ALYX_NFT;
    address immutable public LISTED_ALYX_NFT;
    address immutable public MARKET;
    address public TEAM_ADDR;
    address public operator;

    /**************************************************************************
     *****  AlynNFT fields  ***************************************************
     **************************************************************************/
    // mint price
    uint256 public mintPriceInAU;
    uint256 public mintPriceInUSDT;
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
    uint256[] public directRequirements;
    uint256[] public performanceRequirements;
    uint256[] public socialRewardRates;
    uint256 public contributionRewardThreshold;
    uint256[] public contributionRewardAmounts;
    uint256 public maxInvitationLevel;
    mapping(uint256 => uint256[]) public communityRewardRates;

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

    constructor(address[] memory addr) {
        USDT_TOKEN = addr[0];
        LYNK_TOKEN =addr[1];
        AP_TOKEN = addr[2];
        KEY_TOKEN =addr[3];
        STAKING = addr[4];
        ALYX_NFT = addr[5];
        STAKING_ALYX_NFT = addr[6];
        LISTED_ALYX_NFT = addr[7];
        MARKET = addr[8];
        USER_INFO = addr[9];
        TEAM_ADDR = addr[10];
    }

    function __DBContract_init() public initializer {
        __DBContract_init_unchained();
        __Ownable_init();
    }

    function __DBContract_init_unchained() public onlyInitializing {
    }

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
    }

    function setTeamAddr(address _teamAddr) external onlyOperator {
        TEAM_ADDR = _teamAddr;
    }


    /**************************************************************************
     *****  AlynNFT Manager  **************************************************
     **************************************************************************/
    function setMintPrice(uint256 _mintPriceInAU, uint256 _mintPriceInUSDT) external onlyOperator {
        mintPriceInAU = _mintPriceInAU;
        mintPriceInUSDT = _mintPriceInUSDT;
    }

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
    function setAttributeLevelThreshold(IAlyxNFT.Attribute _attr, uint256[] calldata _thresholds) external onlyOperator {
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
    function calcLevel(IAlyxNFT.Attribute _attr, uint256 _point) external view returns (uint256 level, uint256 overflow) {
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

}
