// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../baseContract.sol";
import "../interfaces/IUser.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract APToken is ERC20PermitUpgradeable, baseContract {

    constructor(address dbAddress) baseContract(dbAddress) { }

    function __APToken_init() public initializer {
        __APToken_init_unchained();
        __ERC20Permit_init("attribute_point_token");
        __ERC20_init("Attribute Point", "AP");
    }

    function __APToken_init_unchained() public onlyInitializing {

    }

    function mint(uint256 _indexPackage, address _ref) external {
        uint256[] memory package = DBContract(DB_CONTRACT).packageByIndex(_indexPackage);
        require(package.length == 3, 'APToken: unrecognized package.');

        _pay(address(uint160(package[0])), _msgSender(), package[1]);
        _mint(_msgSender(), package[2]);

        IUser(DBContract(DB_CONTRACT).USER_INFO()).hookByBuyAPToken(_ref, _msgSender());
    }

}
