// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Swap is baseContract, ReentrancyGuardUpgradeable {

    constructor(address dbContract) baseContract(dbContract) {

    }

    function __Swap_init() public initializer {
        __baseContract_init();
        __Swap_init_unchained();
        __ReentrancyGuard_init();
    }

    function __Swap_init_unchained() private {
    }

    function swap(uint256 _amountIn) external nonReentrant {
        address lynkAddress = DBContract(DB_CONTRACT).LYNK_TOKEN();
        require(IERC20Upgradeable(lynkAddress).balanceOf(_msgSender()) >= _amountIn, 'insufficient LYNK.');
        
        uint256 priceInALYX = DBContract(DB_CONTRACT).lynkPriceInALYX();
        require(priceInALYX > 0, 'must init first.');
        uint256 _amountOut = _amountIn * priceInALYX / 1 ether;
        require(address(this).balance >= _amountOut, 'insufficient ALYX.');

        _pay(lynkAddress, _msgSender(), _amountIn);
        AddressUpgradeable.sendValue(payable(_msgSender()), _amountOut);
    }

}
