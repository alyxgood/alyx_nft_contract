// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

interface IUser {

    enum Level {
        elite,
        epic,
        master,
        legendary,
        mythic,
        divine
    }

    function hookByMint(address refAddr, address userAddr) external;
    function hookByUpgrade(address _refAddr, address _userAddr, uint256 _performance) external;
    function hookByBuyAPToken(address _refAddr, address _userAddr) external;
    function hookByBuyNFT(address _refAddr, address _userAddr) external;

}