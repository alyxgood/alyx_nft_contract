// We import the hardhat environment field we are planning to use
import { ethers ,deployments} from "hardhat";

import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {expect} from "chai";
import {MockERC20} from "../typechain-types";


export interface USER_FIX {
    deployer1: SignerWithAddress,
    deployer2: SignerWithAddress,
    owner1: SignerWithAddress,
    owner2: SignerWithAddress,
    proxy_admin1: SignerWithAddress,
    proxy_admin2: SignerWithAddress,
    team_addr: SignerWithAddress;
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress,
    user5: SignerWithAddress,
    user6: SignerWithAddress
}

export async function get_user() {
    let   deployer1: SignerWithAddress;
    let   deployer2: SignerWithAddress;
    let   owner1: SignerWithAddress;
    let   owner2: SignerWithAddress;
    let   proxy_admin1: SignerWithAddress;
    let   proxy_admin2: SignerWithAddress;
    let   team_addr: SignerWithAddress;
    let   user1: SignerWithAddress;
    let   user2: SignerWithAddress;
    let   user3: SignerWithAddress;
    let   user4: SignerWithAddress;
    let   user5: SignerWithAddress;
    let   user6: SignerWithAddress;
    // @ts-ignore
    [deployer1, deployer2, owner1, owner2,proxy_admin1,proxy_admin2, team_addr,  user1, user2, user3, user4, user5, user6,] = await ethers.getSigners();
    return {
        deployer1, deployer2, owner1, owner2,proxy_admin1,proxy_admin2, team_addr,  user1, user2, user3, user4, user5, user6
    };

}




export async function set_up_fixture(fix_name: string) {

    await deployments.fixture([fix_name]);

    const contracts = {
        USDT: (await deployments.get('mock_usdc')).address,
    };


    let usdt = <MockERC20>await (await ethers.getContractFactory("MockERC20")).attach(contracts.USDT);

    return {
        usdt
    };

}
