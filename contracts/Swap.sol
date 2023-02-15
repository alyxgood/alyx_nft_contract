// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./baseContract.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./interfaces/IUser.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Swap is baseContract, ReentrancyGuardUpgradeable {

    address public lynkAddress;
    event SwapEvent(address indexed account, uint256 amountIn,uint256 _amountOut);


    constructor(address dbContract) baseContract(dbContract) {

    }

    function __Swap_init() public initializer {
        __baseContract_init();
        __Swap_init_unchained();
        __ReentrancyGuard_init();
    }

    function __Swap_init_unchained() private {
    }

    function setLYNKAddress(address _lynkAddress) external {
        require(_msgSender() == DBContract(DB_CONTRACT).operator());
        lynkAddress = _lynkAddress;
    }

    function swap(uint256 _amountIn) external nonReentrant {
        address lrtAddress = DBContract(DB_CONTRACT).LRT_TOKEN();
        require(IERC20Upgradeable(lrtAddress).balanceOf(_msgSender()) >= _amountIn, 'insufficient LRT.');

        uint256 priceInLYNK = DBContract(DB_CONTRACT).lrtPriceInLYNK();
        require(priceInLYNK > 0, 'must init first.');
        uint256 _amountOut = _amountIn * priceInLYNK / 1 ether;
        require(IERC20Upgradeable(lynkAddress).balanceOf(address(this)) >= _amountOut, 'insufficient LYNK.');

        _pay(lrtAddress, _msgSender(), _amountIn,IUser.REV_TYPE.LRT_ADDR);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(lynkAddress), _msgSender(), _amountOut);
        emit SwapEvent(_msgSender(),_amountIn,_amountOut);
        // AddressUpgradeable.sendValue(payable(_msgSender()), _amountOut);
    }

}
