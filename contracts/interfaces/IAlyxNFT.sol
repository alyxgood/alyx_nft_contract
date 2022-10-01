// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

interface IAlyxNFT {

    enum Attribute {
        charisma,
        dexterity,
        vitality,
        intellect
    }

    function nftInfoOf(uint256 tokenId)
        external
        view
        returns (uint256[] memory _nftInfo);

}