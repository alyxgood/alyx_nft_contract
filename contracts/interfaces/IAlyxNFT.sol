// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

interface IAlyxNFT {

    enum NFTType {
        Boy,
        Girl
    }

    enum Attribute {
        charisma,
        dexterity,
        vitality,
        intellect
    }

    function nftInfoOf(uint256 tokenId)
        external
        view
        returns (
            uint256 charisma,
            uint256 dexterity,
            uint256 vitality,
            uint256 intellect
        );

}