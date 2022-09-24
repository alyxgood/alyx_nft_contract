// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155URIStorageUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract KeyToken is OwnableUpgradeable, ERC1155URIStorageUpgradeable {

    // The token id of X chromosome
    uint256 constant public X = 0;
    // The token id of Y chromosome
    uint256 constant public Y = 1;

    function __KeyToken_init() public initializer {
        __KeyToken_init_unchained();
        OwnableUpgradeable.__Ownable_init();
        ERC1155URIStorageUpgradeable.__ERC1155URIStorage_init();
    }

    function __KeyToken_init_unchained() private onlyInitializing {
    }

    /**
     * @dev Sets `tokenURI` as the tokenURI of `tokenId`.
     */
    function setURI(uint256 _tokenId, string memory _tokenURI) external onlyOwner {
        ERC1155URIStorageUpgradeable._setURI(_tokenId, _tokenURI);
    }

    /**
     * @dev Sets `baseURI` as the `_baseURI` for all tokens
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        ERC1155URIStorageUpgradeable._setBaseURI(_baseURI);
    }

    /**
     * @dev Creates `_amount` tokens of token type `_tokenId`, and assigns them to `msg.sender`.
     */
    function mint(uint256 _tokenId, uint256 _amount) external {
        require(_tokenId == X || _tokenId == Y, 'KeyToken: unknown token id.');

        // TODO: Fee charge ?
        // ...

        ERC1155Upgradeable._mint(msg.sender, _tokenId, _amount, '');
    }

}
