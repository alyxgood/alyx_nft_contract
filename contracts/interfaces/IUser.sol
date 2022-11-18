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

    function isValidUser(address _userAddr) view external returns (bool);

    function hookByUpgrade(address _userAddr, uint256 _performance) external;
    function hookByClaimReward(address _userAddr, uint256 _rewardAmount) external;
    function hookByStake(uint256 nftId) external;
    function hookByUnStake(uint256 nftId) external;
    function registerByEarlyPlan(address _userAddr) external;

}