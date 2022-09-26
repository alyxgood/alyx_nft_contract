// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "./baseContract.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AlyxNft is ERC721EnumerableUpgradeable,baseContract {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter public currentTokenId;

    uint256 private randomSeed;
    uint256 public maxMintPerDayPerAddress;
    mapping(uint256 => NFTInfo) public nftInfoOf;

    enum NFTType {
        Boy,
        Girl
    }

    struct NFTInfo {
        NFTType nftType;
        uint256 charisma;
        uint256 dexterity;
        uint256 vitality;
        uint256 intellect;
    }

    constructor(address dbAddress) baseContract(dbAddress){

    }

    function __KeyToken_init(uint256 _maxMintPerDayPerAddress) public initializer {
        __AlyxNft_init_unchained(_maxMintPerDayPerAddress);
        __ERC721Enumerable_init();
        __ERC721_init("AlyxNft","AlyxNft");
        __baseContract_init();
    }

    function __AlyxNft_init_unchained(uint256 _maxMintPerDayPerAddress) private onlyInitializing {
        _randomSeedGen();
        maxMintPerDayPerAddress = _maxMintPerDayPerAddress;
    }

    function mintTo(NFTType _nftType, address _to, uint256 _numNFT) external {
        for (uint256 index; index < _numNFT; index++) {
            uint256 tokenId = currentTokenId.current();

            (uint256 vitality, uint256 intellect) = _attributesGen(_msgSender());
            nftInfoOf[tokenId] = NFTInfo({
                nftType: _nftType,
                vitality: vitality,
                intellect: intellect,
                dexterity: 0,
                charisma: 0
            });
            ERC721Upgradeable._safeMint(_to, tokenId);
        }
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
}
