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

    function refByMint(address refAddr, address userAddr) external;
    function refByUpgrade(address _refAddr, address _userAddr, uint256 _performance) external;
    function refByBuyAPToken(address _refAddr, address _userAddr) external;
    function refByBuyNFT(address _refAddr, address _userAddr) external;

}