// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./interfaces/IAlyxNFT.sol";
import "./interfaces/IBNFT.sol";
import "./interfaces/IUser.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Staking is baseContract, IERC721ReceiverUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    mapping(address => MiningPower) public miningPowerOf;
    mapping(address => uint256) public rewardOf;
    mapping(address => uint256) public lastUpdateTimeOf;

    event Stake(address indexed account, uint256 tokenId);
    event UnStake(address indexed account, uint256 tokenId);
    event Claim(address indexed account, uint256 amount);

    struct MiningPower {
        uint256 charisma;
        uint256 dexterity;
    }

    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __Staking_init() public initializer {
        __baseContract_init();
        __Staking_init_unchained();
    }

    function __Staking_init_unchained() public onlyInitializing {
    }

    modifier updateReward(address account) {
        uint256 lastUpdateTime = lastUpdateTimeOf[account];
        lastUpdateTimeOf[account] = block.timestamp;

        uint256 charisma = miningPowerOf[account].charisma;
        uint256 dexterity = miningPowerOf[account].dexterity;
        uint256 rewardRate = _rewardRate(charisma, dexterity);

        rewardOf[account] += rewardRate * (block.timestamp - lastUpdateTime);

        _;
    }

    function stake(uint256[] calldata nftIds) external updateReward(_msgSender()) {
        uint256 charisma = 0;
        uint256 dexterity = 0;
        address alyxNFTAddress = DBContract(DB_CONTRACT).ALYX_NFT();
        address bAlyxNFTAddress = DBContract(DB_CONTRACT).STAKING_ALYX_NFT();

        for (uint256 index; index < nftIds.length; index++) {
            IERC721Upgradeable(alyxNFTAddress).safeTransferFrom(_msgSender(), address(this), nftIds[index]);
            IERC721Upgradeable(alyxNFTAddress).approve(bAlyxNFTAddress, nftIds[index]);
            IBNFT(bAlyxNFTAddress).mint(_msgSender(), nftIds[index]);

            emit Stake(_msgSender(), nftIds[index]);

            uint256[] memory nftInfo = IAlyxNFT(alyxNFTAddress).nftInfoOf(nftIds[index]);
            charisma += nftInfo[uint256(IAlyxNFT.Attribute.charisma)];
            dexterity += nftInfo[uint256(IAlyxNFT.Attribute.dexterity)];
        }

        miningPowerOf[_msgSender()].charisma += charisma;
        miningPowerOf[_msgSender()].dexterity += dexterity;
    }

    function unstake(uint256[] calldata nftIds) external updateReward(_msgSender()) {
        uint256 charisma = 0;
        uint256 dexterity = 0;
        address alyxNFTAddress = DBContract(DB_CONTRACT).ALYX_NFT();
        address bAlyxNFTAddress = DBContract(DB_CONTRACT).STAKING_ALYX_NFT();

        uint256 index;
        for (index = 0; index < nftIds.length; index++) {
            require(IERC721Upgradeable(bAlyxNFTAddress).ownerOf(nftIds[index]) == _msgSender(), 'Staking: not the owner.');
        }

        for (index = 0; index < nftIds.length; index++) {
            IBNFT(bAlyxNFTAddress).burn(nftIds[index]);
            IERC721Upgradeable(alyxNFTAddress).safeTransferFrom(address(this), _msgSender(), nftIds[index]);

            emit UnStake(_msgSender(), nftIds[index]);

            uint256[] memory nftInfo = IAlyxNFT(alyxNFTAddress).nftInfoOf(nftIds[index]);
            charisma += nftInfo[uint256(IAlyxNFT.Attribute.charisma)];
            dexterity += nftInfo[uint256(IAlyxNFT.Attribute.dexterity)];
        }

        miningPowerOf[_msgSender()].charisma -= charisma;
        miningPowerOf[_msgSender()].dexterity -= dexterity;
    }

    function claimReward() external updateReward(_msgSender()) {
        uint256 claimable = rewardOf[_msgSender()];
        require(claimable > 0, 'Staking: cannot claim 0.');

        rewardOf[_msgSender()] = 0;
        IERC20Upgradeable(DBContract(DB_CONTRACT).LYNK_TOKEN()).safeTransfer(_msgSender(), claimable);

        emit Claim(_msgSender(), claimable);

        IUser(DBContract(DB_CONTRACT).USER_INFO()).hookByClaimReward(_msgSender(), claimable);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external override pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function _rewardRate(uint256 charisma, uint256 dexterity) private pure returns (uint256) {
        uint256 rewardPerDay = ((0.007 ether) * charisma) + ((0.005 ether) * charisma * dexterity / 100);

        return rewardPerDay / 1 days;
    }

}
