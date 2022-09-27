// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";
contract DBContract is OwnableUpgradeable {

    address immutable public USDT_TOKEN;

    address immutable public AU_TOKEN;

    address immutable public BP_TOKEN;

    address immutable public KEY_TOKEN;

    address immutable public STAKING;

    address immutable public USER_INFO;

    address immutable public ALYX_NFT;

    address immutable public MARKET;

    address public TEAM_ADDR;

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

}
