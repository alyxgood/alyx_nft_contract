// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";
contract DBContract is OwnableUpgradeable {

    /**************************************************************************
     *****  Common fields  ****************************************************
     **************************************************************************/
    address immutable public USDT_TOKEN;
    address immutable public AU_TOKEN;
    address immutable public BP_TOKEN;
    address immutable public KEY_TOKEN;
    address immutable public STAKING;
    address immutable public USER_INFO;
    address immutable public ALYX_NFT;
    address immutable public MARKET;
    address public TEAM_ADDR;

    /**************************************************************************
     *****  AlynNFT fields  ***************************************************
     **************************************************************************/
    // mint price
    uint256 public mintPriceInAU;
    uint256 public mintPriceInUSDT;
    address public recipient;
    uint256 public maxMintPerDayPerAddress;
    string public baseTokenURI;

    constructor(address[] memory addr){
        USDT_TOKEN = addr[0];
        AU_TOKEN =addr[1];
        BP_TOKEN = addr[2];
        KEY_TOKEN =addr[3];
        STAKING = addr[4];
        ALYX_NFT = addr[5];
        MARKET = addr[6];
        USER_INFO = addr[7];
        TEAM_ADDR = addr[8];
    }

    function __BoosterToken_init() public initializer {
        __DBContract_init_unchained();
        __Ownable_init();
    }

    function __DBContract_init_unchained() public onlyInitializing {
    }


    /**************************************************************************
     *****  AlynNFT Manager  **************************************************
     **************************************************************************/
    function setMintPrice(uint256 _mintPriceInAU, uint256 _mintPriceInUSDT) external onlyOwner {
        mintPriceInAU = _mintPriceInAU;
        mintPriceInUSDT = _mintPriceInUSDT;
    }

    function setRecipient(address _recipient) external onlyOwner {
        recipient = _recipient;
    }

    function setMaxMintPerDayPerAddress(uint256 _maxMintPerDayPerAddress) external onlyOwner {
        maxMintPerDayPerAddress = _maxMintPerDayPerAddress;
    }

    function setBaseTokenURI(string calldata _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }


}
