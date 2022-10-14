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
import {BigNumber} from "ethers";


export interface USER_FIX {
    deployer1: SignerWithAddress,
    deployer2: SignerWithAddress,
    owner1: SignerWithAddress,
    owner2: SignerWithAddress,
    proxy_admin1: SignerWithAddress,
    proxy_admin2: SignerWithAddress,
    operator: SignerWithAddress,
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
    apToken: MockERC20,
    LYNKToken: MockERC20,
    LYNKNFT: LYNKNFT,
    sLYNKNFT: BNFT,
    lLYNKNFT: BNFT,
    user: User,
    staking: Staking,
    market: Market,
}

export interface ENV_FIX {
    MAX_MINT_PER_DAY_PER_ADDRESS: string,
    ATTRIBUTE_VA: string[],
    ATTRIBUTE_IN: string[],
    ATTRIBUTE_DX: string[],
    ATTRIBUTE_CA: string[],
    SELLING_LEVEL_LIMIT: string,
    TRADING_FEE: string
    ROOT: string,
    AP_PACKAGE: string[][],
    DIRECT_REQUIREMENTS: string[],
    PERFORMANCE_REQUIREMENTS: string[],
    SOCIAL_REWARD: string[],
    COMMUNITY_REWARD: string[][],
    CONTRIBUTION_THRESHOLD: string,
    CONTRIBUTION_REWARD: string[],
    ACHIEVEMENT_LEVEL_THRESHOLD: string,
    ACHIEVEMENT_DURATION: string
    ACHIEVEMENT_REWARD: string[],
}

export async function get_user() {
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
    [deployer1, deployer2, owner1, owner2, proxy_admin1, proxy_admin2, operator, team_addr,  user1, user2, user3, user4, user5, user6,] = await ethers.getSigners();
    return {
        deployer1, deployer2, owner1, owner2, proxy_admin1, proxy_admin2, operator, team_addr,  user1, user2, user3, user4, user5, user6
    };

}


export function getEnv() {
    let MAX_MINT_PER_DAY_PER_ADDRESS: string
    let ATTRIBUTE_VA: string[]
    let ATTRIBUTE_IN: string[]
    let ATTRIBUTE_DX: string[]
    let ATTRIBUTE_CA: string[]
    let SELLING_LEVEL_LIMIT: string
    let TRADING_FEE: string
    let ROOT: string
    let AP_PACKAGE: string[][]
    let DIRECT_REQUIREMENTS: string[]
    let PERFORMANCE_REQUIREMENTS: string[]
    let SOCIAL_REWARD: string[]
    let COMMUNITY_REWARD: string[][]
    let CONTRIBUTION_THRESHOLD: string
    let CONTRIBUTION_REWARD: string[]
    let ACHIEVEMENT_LEVEL_THRESHOLD: string
    let ACHIEVEMENT_DURATION: string
    let ACHIEVEMENT_REWARD: string[]

    MAX_MINT_PER_DAY_PER_ADDRESS = process.env.MAX_MINT_PER_DAY_PER_ADDRESS ? process.env.MAX_MINT_PER_DAY_PER_ADDRESS : '2'
    ATTRIBUTE_VA = (process.env.ATTRIBUTE_VA ? process.env.ATTRIBUTE_VA : '10,20,40,80,160,320,640,1280,2560,5120,10240,20480,40960').split(',')
    ATTRIBUTE_IN = (process.env.ATTRIBUTE_IN ? process.env.ATTRIBUTE_IN : '10,20,30,40,50,60,70,80,90,100,110,120,130').split(',')
    ATTRIBUTE_DX = (process.env.ATTRIBUTE_DX ? process.env.ATTRIBUTE_DX : '5,10,15,20,25,30,40,50,60,70,80,100,120').split(',')
    ATTRIBUTE_CA = (process.env.ATTRIBUTE_CA ? process.env.ATTRIBUTE_CA : '100,500,1000,3000,5000,10000,20000,30000,50000,100000').split(',')
    SELLING_LEVEL_LIMIT = process.env.SELLING_LEVEL_LIMIT ? process.env.SELLING_LEVEL_LIMIT : '2'
    TRADING_FEE = ethers.utils.parseEther(process.env.TRADING_FEE ? process.env.TRADING_FEE : '0.003').toString()
    ROOT = process.env.ROOT ? process.env.ROOT : '0x000000000000000000000000000000000000dEaD'

    const apPackage = process.env.AP_PACKAGE ? process.env.AP_PACKAGE : '0,30,1|0,3000,110|0,12000,450|0,30000,1200'
    const packages = apPackage.split('|')
    AP_PACKAGE = new Array(packages.length)
    for (let index = 0; index < packages.length; index++) {
        const pkg = packages[index].split(',')
        AP_PACKAGE.push(pkg)
    }

    const upCondition = process.env.UP_CONDITION ? process.env.UP_CONDITION : '3,10000|3,50000|3,100000|3,300000|3,1000000'
    const conditions = upCondition.split('|')
    DIRECT_REQUIREMENTS = []
    PERFORMANCE_REQUIREMENTS = []
    for (let index = 0; index < conditions.length; index++) {
        const condition = conditions[index].split(',')
        DIRECT_REQUIREMENTS.push(condition[0])
        PERFORMANCE_REQUIREMENTS.push(condition[1])
    }

    SOCIAL_REWARD = (process.env.SOCIAL_REWARD ? process.env.SOCIAL_REWARD : '5,6,7,8,9,10').split(',')

    CONTRIBUTION_THRESHOLD = ethers.utils.parseEther(process.env.CONTRIBUTION_THRESHOLD ? process.env.CONTRIBUTION_THRESHOLD : '100').toString()
    CONTRIBUTION_REWARD = (process.env.CONTRIBUTION_REWARD ? process.env.CONTRIBUTION_REWARD : '1,2,3,4,5,6').split(',')
    for (let index = 0; index < CONTRIBUTION_REWARD.length; index++) {
        CONTRIBUTION_REWARD[index] = ethers.utils.parseEther(CONTRIBUTION_REWARD[index]).toString()
    }

    const communityReward = process.env.COMMUNITY_REWARD ? process.env.COMMUNITY_REWARD : '15|20,10|25,15,10,5,5|30,20,10,5,5,3,3,3,3,3|30,20,10,5,5,3,3,3,3,3,2,2,2,2,2|30,20,10,5,5,3,3,3,3,3,2,2,2,2,2,1,1,1,1,1'
    const rewards = communityReward.split('|')
    COMMUNITY_REWARD = []
    for (let index = 0; index < rewards.length; index++) {
        const reward = rewards[index].split(',')
        for (let indexReward = 0; indexReward < reward.length; indexReward++) {
            reward[indexReward] = ethers.utils.parseEther(reward[indexReward]).div(BigNumber.from(100)).toString()
        }
        COMMUNITY_REWARD.push(reward)
    }

    ACHIEVEMENT_LEVEL_THRESHOLD = process.env.CONTRIBUTION_THRESHOLD ? process.env.CONTRIBUTION_THRESHOLD : '2'
    ACHIEVEMENT_DURATION = BigNumber.from(process.env.ACHIEVEMENT_DURATION ? process.env.ACHIEVEMENT_DURATION : '10').mul(BigNumber.from(24*60*60)).toString()
    ACHIEVEMENT_REWARD = (process.env.ACHIEVEMENT_REWARD ? process.env.ACHIEVEMENT_REWARD : '10,20,40,60,80,100').split(',')
    for (let index = 0; index < ACHIEVEMENT_REWARD.length; index++) {
        ACHIEVEMENT_REWARD[index] = ethers.utils.parseEther(ACHIEVEMENT_REWARD[index]).toString()
    }

    return {
        MAX_MINT_PER_DAY_PER_ADDRESS,
        ATTRIBUTE_VA,
        ATTRIBUTE_IN,
        ATTRIBUTE_DX,
        ATTRIBUTE_CA,
        SELLING_LEVEL_LIMIT,
        TRADING_FEE,
        ROOT,
        AP_PACKAGE,
        DIRECT_REQUIREMENTS,
        PERFORMANCE_REQUIREMENTS,
        SOCIAL_REWARD,
        COMMUNITY_REWARD,
        CONTRIBUTION_THRESHOLD,
        CONTRIBUTION_REWARD,
        ACHIEVEMENT_LEVEL_THRESHOLD,
        ACHIEVEMENT_DURATION,
        ACHIEVEMENT_REWARD,
    }
}

export async function set_up_fixture(fix_name: string) {

    await deployments.fixture([fix_name]);

    const contracts = {
        USDT: (await deployments.get('mock_usdt')).address,
        DBContract: (await deployments.get('DBContract_Proxy')).address,
        APToken: (await deployments.get('mock_ap_token')).address,
        LYNKToken: (await deployments.get('mock_lynk_token')).address,
        LYNKNFT: (await deployments.get('LYNKNFT_Proxy')).address,
        sLYNKNFT: (await deployments.get('sLYNKNFT_Proxy')).address,
        lLYNKNFT: (await deployments.get('lLYNKNFT_Proxy')).address,
        User: (await deployments.get('User_Proxy')).address,
        Staking: (await deployments.get('Staking_Proxy')).address,
        Market: (await deployments.get('Market_Proxy')).address,
    };


    const USDT = <MockERC20> await (await ethers.getContractFactory("MockERC20")).attach(contracts.USDT)
    const dbContract = <DBContract> await (await ethers.getContractFactory('DBContract')).attach(contracts.DBContract)
    const apToken = <MockERC20> await (await ethers.getContractFactory('MockERC20')).attach(contracts.APToken)
    const LYNKToken = <MockERC20> await (await ethers.getContractFactory('MockERC20')).attach(contracts.LYNKToken)
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
