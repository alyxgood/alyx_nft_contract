// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import {IBNFT} from "../interfaces/IBNFT.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

contract BNFTTest is IERC721ReceiverUpgradeable {
    constructor() { }

    function onERC721Received(address, address, uint256, bytes calldata) external override pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function mint(address underlyingAddress, address bnftAddress, uint256 tokenId) external {
        IERC721Upgradeable(underlyingAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        IERC721Upgradeable(underlyingAddress).approve(bnftAddress, tokenId);
        IBNFT(bnftAddress).mint(msg.sender, tokenId);
    }

    function mintDirect(address bnftAddress, uint256 tokenId) external {
        IBNFT(bnftAddress).mint(msg.sender, tokenId);
    }

    function mintTwice(address underlyingAddress, address bnftAddress, uint256 tokenId) external {
        IERC721Upgradeable(underlyingAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        IERC721Upgradeable(underlyingAddress).approve(bnftAddress, tokenId);
        IBNFT(bnftAddress).mint(msg.sender, tokenId);

        // try again
        IBNFT(bnftAddress).mint(msg.sender, tokenId);
    }

    function burn(address bnftAddress, uint256 tokenId) external {
        IBNFT(bnftAddress).burn(tokenId);
    }
}
