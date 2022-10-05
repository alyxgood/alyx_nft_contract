// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./DBContract.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

abstract contract baseContract is ContextUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address constant public BLACK_HOLE = address(0xdead);
    address immutable public DB_CONTRACT;

    constructor(address dbContract) {
        DB_CONTRACT = dbContract;
    }
    function __baseContract_init() public initializer {
        __Context_init();
    }

    function _pay(address _payment, address _payer, uint256 _amount) internal {
        if (address(0) == _payment) {
            require(msg.value == _amount, 'baseContract: invalid value.');
            AddressUpgradeable.sendValue(payable(DBContract(DB_CONTRACT).TEAM_ADDR()), _amount);
            return;
        }

        require(
            IERC20Upgradeable(_payment).allowance(_payer, address(this)) >= _amount,
            'baseContract: insufficient allowance'
        );
        if (DBContract(DB_CONTRACT).USDT_TOKEN() == _payment) {
            IERC20Upgradeable(_payment).safeTransferFrom(_payer, DBContract(DB_CONTRACT).TEAM_ADDR(), _amount);
        } else {
            IERC20Upgradeable(_payment).safeTransferFrom(_payer, BLACK_HOLE, _amount);
        }
    }

}
