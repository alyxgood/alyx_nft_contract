import {expect} from "chai";
import {ethers} from "hardhat";
import {MockERC20} from "../typechain-types";
import {get_user, set_up_fixture} from "./start_up";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";

describe("USDT TEST", function () {

     let usdt_erc20:MockERC20;
     let user1: SignerWithAddress;

    beforeEach(async () => {
      let fix_info = await set_up_fixture("MockERC20");
      let users = await get_user();
      usdt_erc20 = fix_info.usdt;
      user1 = users.user1;
    });

  describe("USDT TEST", function () {
    it("test mint", async function () {
      let usdc = ethers.utils.parseUnits("1", 6);
      await usdt_erc20.connect(user1).mint(user1.address,usdc);
      expect(await usdt_erc20.balanceOf(user1.address)).equal(usdc);

    });

  });

});
