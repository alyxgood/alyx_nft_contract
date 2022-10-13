// We import the hardhat environment field we are planning to use
import { ethers ,deployments} from "hardhat";

import {SignerWithAddress} from "hardhat-deploy-ethers/signers";

import {
    APToken,
    BNFT,
    DBContract,
    LYNKNFT,
    LYNKToken,
    Market,
    MockERC20,
    Staking,
    User
} from "../typechain-types";


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

export interface CONTRACT_FIX {
    USDT: MockERC20,
    dbContract: DBContract,
    apToken: APToken,
    LYNKToken: LYNKToken,
    LYNKNFT: LYNKNFT,
    sLYNKNFT: BNFT,
    lLYNKNFT: BNFT,
    user: User,
    staking: Staking,
    market: Market,
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
        DBContract: (await deployments.get('DBContract_Proxy')).address,
        APToken: (await deployments.get('APToken_Proxy')).address,
        LYNKToken: (await deployments.get('LYNKToken_Proxy')).address,
        LYNKNFT: (await deployments.get('LYNKNFT_Proxy')).address,
        sLYNKNFT: (await deployments.get('sLYNKNFT_Proxy')).address,
        lLYNKNFT: (await deployments.get('lLYNKNFT_Proxy')).address,
        User: (await deployments.get('User_Proxy')).address,
        Staking: (await deployments.get('Staking_Proxy')).address,
        Market: (await deployments.get('Market_Proxy')).address,
    };


    const USDT = <MockERC20> await (await ethers.getContractFactory("MockERC20")).attach(contracts.USDT)
    const dbContract = <DBContract> await (await ethers.getContractFactory('DBContract')).attach(contracts.DBContract)
    const apToken = <APToken> await (await ethers.getContractFactory('APToken')).attach(contracts.APToken)
    const LYNKToken = <LYNKToken> await (await ethers.getContractFactory('LYNKToken')).attach(contracts.LYNKToken)
    const LYNKNFT = <LYNKNFT> await (await ethers.getContractFactory('LYNKNFT')).attach(contracts.LYNKNFT)
    const sLYNKNFT = <BNFT> await (await ethers.getContractFactory('BNFT')).attach(contracts.sLYNKNFT)
    const lLYNKNFT = <BNFT> await (await ethers.getContractFactory('BNFT')).attach(contracts.lLYNKNFT)
    const user = <User> await (await ethers.getContractFactory('User')).attach(contracts.User)
    const staking = <Staking> await (await ethers.getContractFactory('Staking')).attach(contracts.Staking)
    const market = <Market> await (await ethers.getContractFactory('Market')).attach(contracts.Market)


    return {
        USDT,
        dbContract,
        apToken,
        LYNKToken,
        LYNKNFT,
        sLYNKNFT,
        lLYNKNFT,
        user,
        staking,
        market
    };

}
