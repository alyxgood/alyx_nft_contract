// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../baseContract.sol";
import "../interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract LRTToken is ERC20PermitUpgradeable, baseContract, IERC20Mintable {

    constructor(address dbAddress) baseContract(dbAddress) { }

    mapping(address => bool) public Wl;

    function __LRTToken_init() public initializer {
        __LRTToken_init_unchained();
        __ERC20Permit_init("LRT Token");
        __ERC20_init("LRT Token", "LRT");
        __baseContract_init();
    }

    function __LRTToken_init_unchained() private {
    }

    function mint(address account, uint256 amount) external onlyUserOrStakingContract {
        _mint(account, amount);
    }

    function setWL(address addr,bool value) external onlyOperator{
        if(value)
            Wl[addr]=true;
        else
            delete WL[addr];
    }

    function _beforeTokenTransfer (address from,address to,uint256 amount)internal virtual override
    {
        require(Wl[from] || WL[to],"not in wl");
    }

}
