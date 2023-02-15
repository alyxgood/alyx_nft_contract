// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../baseContract.sol";
import "../interfaces/IUser.sol";
import "../interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract APToken is ERC20PermitUpgradeable, baseContract, IERC20Mintable {

    constructor(address dbAddress) baseContract(dbAddress) { }

    function __APToken_init() public initializer {
        __APToken_init_unchained();
        __ERC20Permit_init("Attribute Point");
        __ERC20_init("Attribute Point", "AP ");
        __baseContract_init();
    }

    function __APToken_init_unchained() private {

    }

    function mint(uint256 _indexPackage) external payable {
        require(
            IUser(DBContract(DB_CONTRACT).USER_INFO()).isValidUser(_msgSender()),
                'APToken: not a valid user.'
        );

        uint256[] memory package = DBContract(DB_CONTRACT).packageByIndex(_indexPackage);
        // only settle if length eq 3. {@link DBContract#setSellingPackage}
        // require(package.length == 3, 'APToken: unrecognized package.');

        _pay(address(uint160(package[0])), _msgSender(), package[1],IUser.REV_TYPE.LYNK_ADDR);
        _mint(_msgSender(), package[2]);
    }

    function mint(address account, uint256 amount) external onlyUserContract {
        _mint(account, amount);
    }

    function _beforeTokenTransfer (address from,address to,uint256 amount)internal virtual override
    {

        address target = DBContract(DB_CONTRACT).revADDR(uint256(IUser.REV_TYPE.LRT_ADDR));
        if(from == target || to == target){
            return ;
        }
        if(from == address(0)){
            return ;
        }
        require(false,"can token can not transfer");
    }

}
