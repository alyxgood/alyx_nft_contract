// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "./DBContract.sol";
import "./interfaces/IAlyxNFT.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AlyxNFT is IAlyxNFT, ERC721EnumerableUpgradeable, baseContract {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter public currentTokenId;

    uint256 private randomSeed;
    mapping(uint256 => uint256[]) public nftInfo;
    mapping(address => uint256) public lastMintTime;

    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __KeyToken_init() public initializer {
        __AlyxNft_init_unchained();
        __ERC721Enumerable_init();
        __ERC721_init("AlyxNFT","AlyxNFT");
        __baseContract_init();
    }

    function __AlyxNft_init_unchained() private onlyInitializing {
        _randomSeedGen();
    }

    function mintTo(address _to, uint256 _numNFT, address _payment) external {
        require(
            _numNFT <= DBContract(DB_CONTRACT).maxMintPerDayPerAddress() &&
            block.timestamp - lastMintTime[_msgSender()] >= 1 days,
                'AlyxNFT: cannot mint more in a day.'
        );
        lastMintTime[_msgSender()] = block.timestamp;

        require(
            DBContract(DB_CONTRACT).AU_TOKEN() == _payment ||
            DBContract(DB_CONTRACT).USDT_TOKEN() == _payment,
                'AlyxNFT: unsupported payment.'
        );
        uint256 mintPrice = DBContract(DB_CONTRACT).mintPriceInAU();
        if (DBContract(DB_CONTRACT).USDT_TOKEN() == _payment)
            mintPrice = DBContract(DB_CONTRACT).mintPriceInUSDT();
        uint256 mintPriceTotal = mintPrice * _numNFT;

        _pay(_payment, _msgSender(), mintPriceTotal);
        for (uint256 index; index < _numNFT; index++) {
            uint256 tokenId = currentTokenId.current();

            (uint256 vitality, uint256 intellect) = _attributesGen(_msgSender());
            nftInfo[tokenId] = [ vitality, intellect, 0, 0];
            ERC721Upgradeable._safeMint(_to, tokenId);
        }
    }

    function upgrade(Attribute _attr, uint256 tokenId, uint256 _point, address _payment) external {
        uint256 decimal = IERC20MetadataUpgradeable(_payment).decimals();
        uint256 amount = _point * (10 ** decimal);
        _pay(_payment, _msgSender(), amount);

        if (Attribute.charisma == _attr) {
            require(
                _payment == DBContract(DB_CONTRACT).USDT_TOKEN() ||
                _payment == DBContract(DB_CONTRACT).AU_TOKEN(),
                    'AlyxNFT: unsupported payment.'
            );
        } else {
            uint256 preAttrIndex = uint256(_attr) - 1;
            (uint256 preAttrLevel,) = DBContract(DB_CONTRACT).calcLevel(Attribute(preAttrIndex), nftInfo[tokenId][preAttrIndex]);
            (uint256 curAttrLevelAfterUpgrade, uint256 curAttrLevelOverflowAfterUpgrade) = DBContract(DB_CONTRACT).calcLevel(_attr, _point + nftInfo[tokenId][uint256(_attr)]);
            require(
                preAttrLevel > curAttrLevelAfterUpgrade ||
                (preAttrLevel == curAttrLevelAfterUpgrade && curAttrLevelOverflowAfterUpgrade == 0),
                    'AlyxNFT: level overflow.'
            );

            require(_payment == DBContract(DB_CONTRACT).BP_TOKEN(), 'AlyxNFT: unsupported payment.');
        }

        nftInfo[tokenId][uint256(_attr)] += _point;
    }

    function nftInfoOf(uint256 tokenId) external view override returns (
        uint256 charisma,
        uint256 dexterity,
        uint256 vitality,
        uint256 intellect
    ) {
        charisma = nftInfo[tokenId][uint256(Attribute.charisma)];
        dexterity = nftInfo[tokenId][uint256(Attribute.dexterity)];
        vitality = nftInfo[tokenId][uint256(Attribute.vitality)];
        intellect = nftInfo[tokenId][uint256(Attribute.intellect)];
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
