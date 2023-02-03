// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Swap is baseContract, ReentrancyGuardUpgradeable {

    address public alyxAddress;

    constructor(address dbContract) baseContract(dbContract) {

    }

    function __Swap_init() public initializer {
        __baseContract_init();
        __Swap_init_unchained();
        __ReentrancyGuard_init();
    }

    function __Swap_init_unchained() private {
    }

    function setALYXAddress(address _alyxAddress) external {
        require(_msgSender() == DBContract(DB_CONTRACT).operator());
        alyxAddress = _alyxAddress;
    }

    function swap(uint256 _amountIn) external nonReentrant {
        address lynkAddress = DBContract(DB_CONTRACT).LYNK_TOKEN();
        require(IERC20Upgradeable(lynkAddress).balanceOf(_msgSender()) >= _amountIn, 'insufficient LRT.');
        
        uint256 priceInALYX = DBContract(DB_CONTRACT).lynkPriceInALYX();
        require(priceInALYX > 0, 'must init first.');
        uint256 _amountOut = _amountIn * priceInALYX / 1 ether;
        require(IERC20Upgradeable(alyxAddress).balanceOf(address(this)) >= _amountOut, 'insufficient LYNK.');

        _pay(lynkAddress, _msgSender(), _amountIn);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(alyxAddress), _msgSender(), _amountOut);
        // AddressUpgradeable.sendValue(payable(_msgSender()), _amountOut);
    }

}
