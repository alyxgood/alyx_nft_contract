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

contract Market is baseContract, IERC721ReceiverUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    ListInfo[] public listNFTs;
    mapping(uint256 => uint256) public listIndexByTokenId;

    event List(address indexed seller, uint256 indexed tokenId, uint256 index, address acceptToken, uint256 priceInAcceptToken);
    event Cancel(uint256 indexed tokenId, uint256 index);
    event Take(address indexed buyer, uint256 indexed tokenId, uint256 index);

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

    function __Market_init_unchained() private {
    }

    function listNFT(uint256 _tokenId, address _acceptToken, uint256 _priceInAcceptToken) external {
        require(
            IUser(DBContract(DB_CONTRACT).USER_INFO()).isValidUser(_msgSender()),
                'Market: not a valid user.'
        );

        // require(_priceInAcceptToken > 0, '');
        address lynkNFTAddress = DBContract(DB_CONTRACT).LYNKNFT();
        address bLYNKNFTAddress = DBContract(DB_CONTRACT).LISTED_LYNKNFT();

        require(IERC721Upgradeable(lynkNFTAddress).ownerOf(_tokenId) == _msgSender(), 'Market: not the owner.');
        require(DBContract(DB_CONTRACT).isAcceptToken(_acceptToken), 'Market: unsupported token.');

        uint256 sellingLevelLimit = DBContract(DB_CONTRACT).sellingLevelLimit();
        require(DBContract(DB_CONTRACT).calcTokenLevel(_tokenId) >= sellingLevelLimit, 'Market: Cannot trade yet.');

        IERC721Upgradeable(lynkNFTAddress).safeTransferFrom(_msgSender(), address(this), _tokenId);
        IERC721Upgradeable(lynkNFTAddress).approve(bLYNKNFTAddress, _tokenId);
        IBNFT(bLYNKNFTAddress).mint(_msgSender(), _tokenId);

        listNFTs.push(ListInfo({
            seller: _msgSender(),
            tokenId: _tokenId,
            acceptToken: _acceptToken,
            priceInAcceptToken: _priceInAcceptToken
        }));
        uint256 index = listNFTs.length - 1;
        listIndexByTokenId[_tokenId] = index;

        emit List(_msgSender(), _tokenId, index, _acceptToken, _priceInAcceptToken);
    }

    function cancelList(uint256 _listIndex, uint256 _tokenId) external {
        uint256 listNFTNum = listNFTs.length;
        require(listNFTNum > _listIndex, 'Market: index overflow.');

        ListInfo memory listInfo = listNFTs[_listIndex];
        address lynkNFTAddress = DBContract(DB_CONTRACT).LYNKNFT();
        address bLYNKNFTAddress = DBContract(DB_CONTRACT).LISTED_LYNKNFT();

        require(listInfo.tokenId == _tokenId, 'Market: token id mismatch.');
        require(listInfo.seller == _msgSender(), 'Market: seller mismatch.');
        // require(IERC721Upgradeable(bLYNKNFTAddress).ownerOf(_tokenId) == _msgSender(), 'Market: not the owner.');

        if (_listIndex < listNFTNum - 1) {
            listNFTs[_listIndex] = listNFTs[listNFTNum - 1];
            listIndexByTokenId[listNFTs[_listIndex].tokenId] = _listIndex;
        }
        listNFTs.pop();
        delete listIndexByTokenId[listNFTNum - 1];

        IBNFT(bLYNKNFTAddress).burn(_tokenId);
        IERC721Upgradeable(lynkNFTAddress).safeTransferFrom(address(this), _msgSender(), _tokenId);

        emit Cancel(_tokenId, _listIndex);
    }

    function takeNFT(uint256 _listIndex, uint256 _tokenId) payable external {
        require(
            IUser(DBContract(DB_CONTRACT).USER_INFO()).isValidUser(_msgSender()),
                'Market: not a valid user.'
        );

        uint256 listNFTNum = listNFTs.length;
        require(listNFTNum > _listIndex, 'Market: index overflow.');
        ListInfo memory listInfo = listNFTs[_listIndex];
        require(listInfo.tokenId == _tokenId, 'Market: token id mismatch.');

        if (_listIndex < listNFTNum - 1) {
            listNFTs[_listIndex] = listNFTs[listNFTNum - 1];
            listIndexByTokenId[listNFTs[_listIndex].tokenId] = _listIndex;
        }
        listNFTs.pop();
        delete listIndexByTokenId[listNFTNum - 1];

        address lynkNFTAddress = DBContract(DB_CONTRACT).LYNKNFT();
        address bLYNKNFTAddress = DBContract(DB_CONTRACT).LISTED_LYNKNFT();
        uint256 fee = listInfo.priceInAcceptToken * DBContract(DB_CONTRACT).tradingFee() / 1e18;

        if (listInfo.acceptToken == address(0)) {
            require(msg.value == listInfo.priceInAcceptToken, 'Market: value mismatch.');
            AddressUpgradeable.sendValue(payable(DBContract(DB_CONTRACT).TEAM_ADDR()), fee);
            AddressUpgradeable.sendValue(payable(listInfo.seller), listInfo.priceInAcceptToken - fee);
        } else {
            IERC20Upgradeable(listInfo.acceptToken).safeTransferFrom(_msgSender(), DBContract(DB_CONTRACT).TEAM_ADDR(), fee);
            IERC20Upgradeable(listInfo.acceptToken).safeTransferFrom(_msgSender(), listInfo.seller, listInfo.priceInAcceptToken - fee);
        }

        IBNFT(bLYNKNFTAddress).burn(_tokenId);
        IERC721Upgradeable(lynkNFTAddress).safeTransferFrom(address(this), _msgSender(), _tokenId);

        emit Take(_msgSender(), _tokenId, _listIndex);
    }

    function onSellNum() external view returns (uint256) {
        return listNFTs.length;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external override pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

}
