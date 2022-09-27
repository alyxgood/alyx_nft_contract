// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./DBContract.sol";
import "./interfaces/IAlyxNft.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Stake is baseContract, IERC721ReceiverUpgradeable {

    mapping(address => MiningPower) public miningPowerOf;
    mapping(address => uint256) public rewardOf;
    mapping(address => uint256) public lastUpdateTimeOf;

    struct MiningPower {
        uint256 charisma;
        uint256 dexterity;
    }

    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __Stake_init() public initializer {
        __baseContract_init();
        __Stake_init_unchained();
    }

    function __Stake_init_unchained() public onlyInitializing {
    }

    modifier updateReward(address account) {
        uint256 charisma = miningPowerOf[account].charisma;
        uint256 dexterity = miningPowerOf[account].dexterity;

        uint256 lastUpdateTime = lastUpdateTimeOf[account];
        lastUpdateTimeOf[account] = block.timestamp;

        uint256 rewardRate = _rewardRate(charisma, dexterity);
        rewardOf[account] += rewardRate * (block.timestamp - lastUpdateTime);

        _;
    }

    function stake(uint256[] calldata nftIds) external updateReward(_msgSender()) {
        uint256 charisma = 0;
        uint256 dexterity = 0;
        address alyxNFTAddress = DBContract(DB_CONTRACT).ALYX_NFT();

        for (uint index; index < nftIds.length; index++) {
            IERC721Upgradeable(alyxNFTAddress).safeTransferFrom(_msgSender(), address(this), nftIds[index]);

            uint256 charismaSingle;
            uint256 dexteritySingle;
            (, charismaSingle, dexteritySingle, ,) = IAlyxNft(alyxNFTAddress).nftInfoOf(nftIds[index]);
            charisma += charismaSingle;
            dexterity += dexteritySingle;
        }

        miningPowerOf[_msgSender()].charisma += charisma;
        miningPowerOf[_msgSender()].dexterity += dexterity;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external override pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function _rewardRate(uint256 charisma, uint256 dexterity) private pure returns (uint256) {
        uint256 rewardPerDay = ((0.007 ether) * charisma) + ((0.005 ether) * dexterity / 100);

        return rewardPerDay / 1 days;
    }

}
