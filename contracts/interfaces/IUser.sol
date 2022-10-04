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

}