// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./interfaces/IUser.sol";
import "./interfaces/IBNFT.sol";
import "./interfaces/ILYNKNFT.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Market is baseContract {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    ListInfo[] public listNFTs;
    mapping(uint256 => uint256) public listIndexByTokenId;

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
        require(
            IUser(DBContract(DB_CONTRACT).USER_INFO()).isValidUser(_msgSender()),
                'Market: not a valid user.'
        );

        // require(_priceInAcceptToken > 0, '');
        address alyxNFTAddress = DBContract(DB_CONTRACT).ALYX_NFT();
        address bAlyxNFTAddress = DBContract(DB_CONTRACT).LISTED_ALYX_NFT();

        require(IERC721Upgradeable(alyxNFTAddress).ownerOf(_tokenId) == _msgSender(), 'Market: not the owner.');
        require(DBContract(DB_CONTRACT).isAcceptToken(_acceptToken), 'Market: unsupported token.');

        uint256 sellingLevelLimit = DBContract(DB_CONTRACT).sellingLevelLimit();
        uint256[] memory nftInfo = ILYNKNFT(DBContract(DB_CONTRACT).ALYX_NFT()).nftInfoOf(_tokenId);
        for (uint256 index; index > nftInfo.length; index++) {
            (uint256 level,) = DBContract(DB_CONTRACT).calcLevel(ILYNKNFT.Attribute(index), nftInfo[index]);
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
        listIndexByTokenId[_tokenId] = listNFTs.length - 1;
    }

    function cancelList(uint256 _listIndex, uint256 _tokenId) external {
        uint256 listNFTNum = listNFTs.length;
        require(listNFTNum > _listIndex, 'Market: index overflow.');

        ListInfo memory listInfo = listNFTs[_listIndex];
        address alyxNFTAddress = DBContract(DB_CONTRACT).ALYX_NFT();
        address bAlyxNFTAddress = DBContract(DB_CONTRACT).LISTED_ALYX_NFT();

        require(listInfo.tokenId == _tokenId, 'Market: token id mismatch.');
        require(listInfo.seller == _msgSender(), 'Market: seller mismatch.');
        require(IERC721Upgradeable(bAlyxNFTAddress).ownerOf(_tokenId) == _msgSender(), 'Market: not the owner.');

        if (_listIndex < listNFTNum - 1) {
            listNFTs[_listIndex] = listNFTs[listNFTNum - 1];
            listIndexByTokenId[listNFTs[_listIndex].tokenId] = _listIndex;
        }
        listNFTs.pop();
        delete listIndexByTokenId[listNFTNum - 1];

        IBNFT(bAlyxNFTAddress).burn(_tokenId);
        IERC721Upgradeable(alyxNFTAddress).safeTransferFrom(address(this), _msgSender(), _tokenId);
    }

    function takeNFT(uint256 _listIndex, uint256 _tokenId) payable external {
        require(
            IUser(DBContract(DB_CONTRACT).USER_INFO()).isValidUser(_msgSender()),
                'Market: not a valid user.'
        );

        uint256 listNFTNum = listNFTs.length;
        require(listNFTNum > _listIndex, 'Market: index overflow.');
        ListInfo memory listInfo = listNFTs[_listIndex];
        require(listInfo.tokenId == _tokenId, 'Market: already sold.');

        if (_listIndex < listNFTNum - 1) {
            listNFTs[_listIndex] = listNFTs[listNFTNum - 1];
            listIndexByTokenId[listNFTs[_listIndex].tokenId] = _listIndex;
        }
        listNFTs.pop();
        delete listIndexByTokenId[listNFTNum - 1];

        address alyxNFTAddress = DBContract(DB_CONTRACT).ALYX_NFT();
        address bAlyxNFTAddress = DBContract(DB_CONTRACT).LISTED_ALYX_NFT();
        uint256 fee = listInfo.priceInAcceptToken * DBContract(DB_CONTRACT).tradingFee() / 1e18;

        if (listInfo.acceptToken == address(0)) {
            require(msg.value == listInfo.priceInAcceptToken, 'Market: value mismatch.');
            AddressUpgradeable.sendValue(payable(DBContract(DB_CONTRACT).TEAM_ADDR()), fee);
            AddressUpgradeable.sendValue(payable(listInfo.seller), listInfo.priceInAcceptToken - fee);
        } else {
            IERC20Upgradeable(listInfo.acceptToken).safeTransferFrom(_msgSender(), DBContract(DB_CONTRACT).TEAM_ADDR(), fee);
            IERC20Upgradeable(listInfo.acceptToken).safeTransferFrom(_msgSender(), listInfo.seller, listInfo.priceInAcceptToken - fee);
        }

        IBNFT(bAlyxNFTAddress).burn(_tokenId);
        IERC721Upgradeable(alyxNFTAddress).safeTransferFrom(address(this), _msgSender(), _tokenId);
    }

    function onSellNum() external view returns (uint256) {
        return listNFTs.length;
    }

}
