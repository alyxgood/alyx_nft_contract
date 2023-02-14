import {HardhatRuntimeEnvironment, TaskArguments} from "hardhat/types";

import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
const hre = require("hardhat");

async function get_user() {
    let   deployer1: SignerWithAddress;
    let   deployer2: SignerWithAddress;
    let   owner1: SignerWithAddress;
    let   owner2: SignerWithAddress;
    let   proxy_admin1: SignerWithAddress;
    let   proxy_admin2: SignerWithAddress;
    let   operator: SignerWithAddress;
    let   team_addr: SignerWithAddress;
    let   user1: SignerWithAddress;
    let   user2: SignerWithAddress;
    let   user3: SignerWithAddress;
    let   user4: SignerWithAddress;
    let   user5: SignerWithAddress;
    let   user6: SignerWithAddress;
    // @ts-ignore
    [deployer1, deployer2, owner1, owner2, proxy_admin1, proxy_admin2, operator, team_addr,  user1, user2, user3, user4, user5, user6,] = await hre.ethers.getSigners();
    return {
        deployer1, deployer2, owner1, owner2, proxy_admin1, proxy_admin2, operator, team_addr,  user1, user2, user3, user4, user5, user6
    };

}

async function updata_LRT(){
    let user = await get_user();
    const LRT_Proxy_address = (await hre.deployments.get("LYNKToken_Proxy")).address;
    const LYNKProxyFactory = await hre.ethers.getContractFactory('LYNKProxy')
    const LRT_Proxy = LYNKProxyFactory.attach(LRT_Proxy_address);
    const LRToken_Implementation = await hre.deployments.get("LYNKToken_Implementation")

    console.log("update LRToken_Implementation - >",LRToken_Implementation.address);

    let over = {
            gasLimit: 300000,
            gasPrice: 2500000007
        }

    const tx = await LRT_Proxy.connect(user.proxy_admin1).upgradeTo(LRToken_Implementation.address,over);

    await tx.wait(1);
}

async function updata_LYNKToken(){
    let user = await get_user();
    const LYNKToken_Proxy_address = (await hre.deployments.get("ALYXToken_Proxy")).address;
    const LYNKProxyFactory = await hre.ethers.getContractFactory('LYNKProxy')
    const LYNKToken_Proxy = LYNKProxyFactory.attach(LYNKToken_Proxy_address);
    const LYNKToken_Implementation = await hre.deployments.get("ALYXToken_Implementation")

    console.log("update LYNKToken_Implementation - >",LYNKToken_Implementation.address);

    let over = {
        gasLimit: 300000,
        gasPrice: 2500000007
    }

    const tx = await LYNKToken_Proxy.connect(user.proxy_admin1).upgradeTo(LYNKToken_Implementation.address,over);

    await tx.wait(1);
}


async function updata_LYNK_NFT(){
    let user = await get_user();
    const LYNKNFT_Proxy_address = (await hre.deployments.get("LYNKNFT_Proxy")).address;
    const LYNKProxyFactory = await hre.ethers.getContractFactory('LYNKProxy')
    const LYNKNFT_Proxy = LYNKProxyFactory.attach(LYNKNFT_Proxy_address);
    const LYNKNFT_Implementation = await hre.deployments.get("LYNKNFT_Implementation")

    console.log("update LYNKNFT_Implementation - >",LYNKNFT_Implementation.address);

    let over = {
        gasLimit: 300000,
        gasPrice: 2500000007
    }

    const tx = await LYNKNFT_Proxy.connect(user.proxy_admin1).upgradeTo(LYNKNFT_Implementation.address,over);

    await tx.wait(1);
}


async function updata_User(){
    let user = await get_user();
    const User_Proxy_address = (await hre.deployments.get("User_Proxy")).address;
    const LYNKProxyFactory = await hre.ethers.getContractFactory('LYNKProxy')
    const User_Proxy_Proxy = LYNKProxyFactory.attach(User_Proxy_address);
    const User_Implementation = await hre.deployments.get("User_Implementation")

    console.log("update User_Implementation - >",User_Implementation.address);

    let over = {
        gasLimit: 300000,
        gasPrice: 2500000007
    }

    const tx = await User_Proxy_Proxy.connect(user.proxy_admin1).upgradeTo(User_Implementation.address,over);

    await tx.wait(1);
}

async function updata_Staking(){
    let user = await get_user();
    const Staking_Proxy_address = (await hre.deployments.get("Staking_Proxy")).address;
    const LYNKProxyFactory = await hre.ethers.getContractFactory('LYNKProxy')
    const Staking_Proxy = LYNKProxyFactory.attach(Staking_Proxy_address);
    const Staking_Implementation = await hre.deployments.get("Staking_Implementation")

    console.log("update Staking_Implementation - >",Staking_Implementation.address);

    let over = {
        gasLimit: 300000,
        gasPrice: 2500000007
    }

    const tx = await Staking_Proxy.connect(user.proxy_admin1).upgradeTo(Staking_Implementation.address,over);

    await tx.wait(1);
}


async function main() {
     // await updata_LRT();
     // await updata_LYNKToken();
     //await updata_LYNK_NFT();
     // await updata_User();
     // await updata_Staking();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
