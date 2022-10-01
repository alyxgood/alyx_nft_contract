// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./interfaces/IBNFT.sol";
import "./interfaces/IAlyxNFT.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Market is baseContract {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    ListInfo[] public listNFTs;

    struct ListInfo {
        address seller;
        uint256 tokenId;
        address acceptToken;
        uint256 priceInAcceptToken;
    }

    constructor(address dbAddress) baseContract(dbAddress) {

    }

    function __Market_init() public initializer {
        __baseContract_init();
        __Market_init_unchained();
    }

    function __Market_init_unchained() private onlyInitializing {
    }

    function listNFT(uint256 _tokenId, address _acceptToken, uint256 _priceInAcceptToken) external {
        // require(_priceInAcceptToken > 0, '');
        address alyxNFTAddress = DBContract(DB_CONTRACT).ALYX_NFT();
        address bAlyxNFTAddress = DBContract(DB_CONTRACT).LISTED_ALYX_NFT();

        require(IERC721Upgradeable(alyxNFTAddress).ownerOf(_tokenId) == _msgSender(), 'Market: not the owner.');
        require(DBContract(DB_CONTRACT).isAcceptToken(_acceptToken), 'Market: unsupported token.');

        uint256 sellingLevelLimit = DBContract(DB_CONTRACT).sellingLevelLimit();
        uint256[] memory nftInfo = IAlyxNFT(DBContract(DB_CONTRACT).ALYX_NFT()).nftInfoOf(_tokenId);
        for (uint256 index; index > nftInfo.length; index++) {
            (uint256 level,) = DBContract(DB_CONTRACT).calcLevel(IAlyxNFT.Attribute(index), nftInfo[index]);
            require(level >= sellingLevelLimit, 'Market: Cannot trade yet.');
        }

        IERC721Upgradeable(alyxNFTAddress).safeTransferFrom(_msgSender(), address(this), _tokenId);
        IERC721Upgradeable(alyxNFTAddress).approve(bAlyxNFTAddress, _tokenId);
        IBNFT(bAlyxNFTAddress).mint(_msgSender(), _tokenId);

        listNFTs.push(ListInfo({
            seller: _msgSender(),
            tokenId: _tokenId,
            acceptToken: _acceptToken,
            priceInAcceptToken: _priceInAcceptToken
        }));
    }

    function onSellNum() external view returns (uint256) {
        return listNFTs.length;
    }

}
