// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../baseContract.sol";
import "../interfaces/IUser.sol";
import "../interfaces/ILYNKNFT.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract LYNKNFT is ILYNKNFT, ERC721EnumerableUpgradeable, baseContract {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter public currentTokenId;

    uint256 private randomSeed;
    mapping(uint256 => uint256[]) public nftInfo;
    mapping(address => MintInfo) public mintInfoOf;

    struct MintInfo {
        uint128 lastMintTime;
        uint128 mintNumInDuration;
    }

    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __LYNKNFT_init() public initializer {
        __LYNKNFT_init_unchained();
        __ERC721Enumerable_init();
        __ERC721_init("LYNKNFT","LYNKNFT");
        __baseContract_init();
    }

    function __LYNKNFT_init_unchained() private onlyInitializing {
        _randomSeedGen();
    }

    function mint(uint256 _tokenId, address _payment) external payable {
        require(
            IUser(DBContract(DB_CONTRACT).USER_INFO()).isValidUser(_msgSender()),
                'LYNKNFT: not a valid user.'
        );

        MintInfo memory mintInfo = mintInfoOf[_msgSender()];
        if (block.timestamp - mintInfo.lastMintTime >= 1 days) {
            mintInfo.mintNumInDuration = 0;
        }
        require(
            mintInfo.mintNumInDuration < DBContract(DB_CONTRACT).maxMintPerDayPerAddress(),
                'LYNKNFT: cannot mint more in a day.'
        );
        mintInfoOf[_msgSender()].lastMintTime = uint128(block.timestamp);
        mintInfoOf[_msgSender()].mintNumInDuration = mintInfo.mintNumInDuration + 1;

        require(
            DBContract(DB_CONTRACT).LYNK_TOKEN() == _payment ||
            DBContract(DB_CONTRACT).USDT_TOKEN() == _payment,
                'LYNKNFT: unsupported payment.'
        );
        uint256 decimal = IERC20MetadataUpgradeable(_payment).decimals();
        uint256 mintPrice;
        if (_tokenId >= 200_000) {
            mintPrice = DBContract(DB_CONTRACT).mintPrices(2) * (10 ** decimal);
        } else if (_tokenId >= 100_000) {
            mintPrice = DBContract(DB_CONTRACT).mintPrices(1) * (10 ** decimal);
        } else {
            mintPrice = DBContract(DB_CONTRACT).mintPrices(0) * (10 ** decimal);
        }
        require(_tokenId < 300_000, 'LYNKNFT: token id too large.');

        _pay(_payment, _msgSender(), mintPrice);

        (uint256 vitality, uint256 intellect) = _attributesGen(_msgSender());
        nftInfo[_tokenId] = [ vitality, intellect, 0, 0];
        ERC721Upgradeable._safeMint(_msgSender(), _tokenId);
    }

    function upgrade(Attribute _attr, uint256 _tokenId, uint256 _point, address _payment) external payable {
        require(
            IUser(DBContract(DB_CONTRACT).USER_INFO()).isValidUser(_msgSender()),
                'LYNKNFT: not a valid user.'
        );

        // avoid upgrade while staking
        require(
            tx.origin == _msgSender() &&
            ERC721Upgradeable.ownerOf(_tokenId) == _msgSender(),
                'LYNKNFT: not the owner'
        );

        if (Attribute.charisma == _attr) {
            require(
                _payment == DBContract(DB_CONTRACT).USDT_TOKEN() ||
                _payment == DBContract(DB_CONTRACT).LYNK_TOKEN(),
                    'LYNKNFT: unsupported payment.'
            );
        } else {
            uint256 preAttrIndex = uint256(_attr) - 1;
            (uint256 preAttrLevel,) = DBContract(DB_CONTRACT).calcLevel(Attribute(preAttrIndex), nftInfo[_tokenId][preAttrIndex]);
            (uint256 curAttrLevelAfterUpgrade, uint256 curAttrLevelOverflowAfterUpgrade) = DBContract(DB_CONTRACT).calcLevel(_attr, _point + nftInfo[_tokenId][uint256(_attr)]);
            require(
                preAttrLevel > curAttrLevelAfterUpgrade ||
                (preAttrLevel == curAttrLevelAfterUpgrade && curAttrLevelOverflowAfterUpgrade == 0),
                    'LYNKNFT: level overflow.'
            );

            require(_payment == DBContract(DB_CONTRACT).AP_TOKEN(), 'LYNKNFT: unsupported payment.');
        }

        uint256 decimal = IERC20MetadataUpgradeable(_payment).decimals();
        uint256 amount = _point * (10 ** decimal);
        _pay(_payment, _msgSender(), amount);

        nftInfo[_tokenId][uint256(_attr)] += _point;

        // dealing with the ref things.
        IUser(DBContract(DB_CONTRACT).USER_INFO()).hookByUpgrade(_msgSender(), Attribute.charisma == _attr ? amount : 0);
    }

    function nftInfoOf(uint256 _tokenId) external view override returns (uint256[] memory _nftInfo) {
        return nftInfo[_tokenId];
    }

    function _attributesGen(address _minter) private returns (uint256 _vitality, uint256 _intellect) {
        uint256 _randomSeed = _randomSeedGen();
        _randomSeed = uint256(keccak256(abi.encodePacked(_randomSeed, _minter)));
        _vitality = ((_randomSeed & 0xff) % 5) + 1;
        _intellect = (((_randomSeed >> 128) & 0xff) % 3) + 1;
    }

    function _randomSeedGen() private returns (uint256 _randomSeed) {
        _randomSeed = uint256(keccak256(abi.encodePacked(randomSeed, block.timestamp, block.difficulty)));
        randomSeed = _randomSeed;
    }

    /// @dev Returns an URI for a given token ID
    function _baseURI() internal view virtual override returns (string memory) {
        return DBContract(DB_CONTRACT).baseTokenURI();
    }
}
