// We import the hardhat environment field we are planning to use
import {deployments, ethers} from "hardhat";

import {SignerWithAddress} from "hardhat-deploy-ethers/signers";

import {APToken, BNFT, DBContract, LRTToken, LYNKNFT, LYNKToken, Market, MockERC20, Staking, User} from "../typechain-types";
import {BigNumber} from "ethers";
import {assert, expect} from "chai";
import {Attribute, Level, TEST_EVN} from "../constants/constants";
import {increase} from "./helpers/time";
import {BigNumberish} from "@ethersproject/bignumber/src.ts/bignumber";

export interface CONTRACT_STATE {
    LYNKNFT_TOKEN_ID: BigNumber
    INVITEE_LIST: Map<string, SignerWithAddress[]>
}

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
    apToken: APToken,
    LRTToken: LRTToken,
    LYNKNFT: LYNKNFT,
    sLYNKNFT: BNFT,
    lLYNKNFT: BNFT,
    user: User,
    staking: Staking,
    market: Market,
    LYNKToken: LYNKToken
}

export interface ENV_FIX {
    environment: string
    USDT_ADDRESS: string
    MINT_PRICES: string[]
    MAX_MINT_PER_DAY_PER_ADDRESS: string,
    TOKEN_BASE_URI: string,
    MAX_VA_ADD_PER_DAY_PER_TOKEN: string,
    MAX_VA_ADD_PER_DAY_PER_TOKENS: string[],
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
    DURATION: string,
    PERFORMANCE_THRESHOLD: string
    EARLY_BIRD_INIT_CA: string,
    EARLY_BIRD_MINT_START_ID: string,
    EARLY_BIRD_MINT_END_ID: string,
    EARLY_BIRD_MINT_PAYMENT: string,
    EARLY_BIRD_MINT_PRICE_IN_PAYMENT: string,
    EARLY_BIRD_MINT_ENABLE: boolean,
    COMMON_MINT_ENABLE: boolean,
    WL_NUM: string,
    EARLY_BIRD_MINT_WL: string[]
    LRT_PRICE_IN_LYNK: string
    TEAM_ADDRESS: string
}

export interface USER_LEVEL_FIX {
    signer_by_level: SignerWithAddress[]
}

export interface NFT_LEVEL_FIX {
    token_id_by_level: number[]
}

export function get_contract_state() {
    let LYNKNFT_TOKEN_ID: BigNumber
    let HOLDER_LIST: Map<string, number[]>
    let INVITEE_LIST: Map<string, SignerWithAddress[]>

    LYNKNFT_TOKEN_ID = BigNumber.from(100_000)
    HOLDER_LIST = new Map<string, number[]>()
    INVITEE_LIST = new Map<string, SignerWithAddress[]>()

    return {
        LYNKNFT_TOKEN_ID,
        HOLDER_LIST,
        INVITEE_LIST
    }
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


export function get_env() {
    let environment: string
    let USDT_ADDRESS: string
    let MINT_PRICES: string[]
    let MAX_MINT_PER_DAY_PER_ADDRESS: string
    let TOKEN_BASE_URI: string
    let MAX_VA_ADD_PER_DAY_PER_TOKEN: string
    let MAX_VA_ADD_PER_DAY_PER_TOKENS: string[]
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
    let DURATION: string
    let PERFORMANCE_THRESHOLD: string
    let EARLY_BIRD_INIT_CA: string
    let EARLY_BIRD_MINT_START_ID: string
    let EARLY_BIRD_MINT_END_ID: string
    let EARLY_BIRD_MINT_PAYMENT: string
    let EARLY_BIRD_MINT_PRICE_IN_PAYMENT: string
    let EARLY_BIRD_MINT_ENABLE: boolean
    let COMMON_MINT_ENABLE: boolean
    let WL_NUM: string
    let EARLY_BIRD_MINT_WL: string[]
    let LRT_PRICE_IN_LYNK: string
    let TEAM_ADDRESS: string

    environment = process.env.environment ? process.env.environment : TEST_EVN  // prod / test
    USDT_ADDRESS = process.env.USDT_ADDRESS ? process.env.USDT_ADDRESS : '0x000000000000000000000000000000000000dEaD'
    MINT_PRICES = (process.env.LYNKNFY_PRICES ? process.env.LYNKNFY_PRICES : '10,100,300').split(',')
    MAX_MINT_PER_DAY_PER_ADDRESS = process.env.MAX_MINT_PER_DAY_PER_ADDRESS ? process.env.MAX_MINT_PER_DAY_PER_ADDRESS : '2'
    TOKEN_BASE_URI = process.env.TOKEN_BASE_URI ? process.env.TOKEN_BASE_URI : ''
    MAX_VA_ADD_PER_DAY_PER_TOKEN = process.env.MAX_VA_ADD_PER_DAY_PER_TOKEN ? process.env.MAX_VA_ADD_PER_DAY_PER_TOKEN : '20'
    MAX_VA_ADD_PER_DAY_PER_TOKENS = (process.env.MAX_VA_ADD_PER_DAY_PER_TOKENS ? process.env.MAX_VA_ADD_PER_DAY_PER_TOKENS : '20,30,40,50,60,70,80,90,100,110,120,130,140').split(',')
    ATTRIBUTE_CA = (process.env.ATTRIBUTE_CA ? process.env.ATTRIBUTE_CA : '100,500,1000,3000,5000,10000,20000,30000,50000,100000').split(',')
    ATTRIBUTE_DX = (process.env.ATTRIBUTE_DX ? process.env.ATTRIBUTE_DX : '5,10,15,20,25,30,40,50,60,70,80,100,120').split(',')
    ATTRIBUTE_VA = (process.env.ATTRIBUTE_VA ? process.env.ATTRIBUTE_VA : '10,20,40,80,160,320,640,1280,2560,5120,10240,20480,40960').split(',')
    ATTRIBUTE_IN = (process.env.ATTRIBUTE_IN ? process.env.ATTRIBUTE_IN : '10,20,30,40,50,60,70,80,90,100,110,120,130').split(',')
    SELLING_LEVEL_LIMIT = process.env.SELLING_LEVEL_LIMIT ? process.env.SELLING_LEVEL_LIMIT : '2'
    TRADING_FEE = ethers.utils.parseEther(process.env.TRADING_FEE ? process.env.TRADING_FEE : '0.003').toString()
    ROOT = process.env.ROOT ? process.env.ROOT : '0x000000000000000000000000000000000000dEaD'

    const apPackage = process.env.AP_PACKAGE ? process.env.AP_PACKAGE : '0,30,1|0,3000,110|0,12000,450|0,30000,1200'
    const packages = apPackage.split('|')
    AP_PACKAGE = []
    for (let index = 0; index < packages.length; index++) {
        const pkg = packages[index].split(',')
        for (let indexPkg = 0; indexPkg < pkg.length; indexPkg++) {
            pkg[indexPkg] = pkg[indexPkg]
            if (indexPkg > 0) {
                pkg[indexPkg] = ethers.utils.parseEther(pkg[indexPkg]).toString()
            }
        }
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
    for (let index = 0; index < SOCIAL_REWARD.length; index++) {
        SOCIAL_REWARD[index] = ethers.utils.parseEther(SOCIAL_REWARD[index]).div(100).toString()
    }

    CONTRIBUTION_THRESHOLD = process.env.CONTRIBUTION_THRESHOLD ? process.env.CONTRIBUTION_THRESHOLD : '100'
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

    ACHIEVEMENT_LEVEL_THRESHOLD = process.env.ACHIEVEMENT_LEVEL_THRESHOLD ? process.env.ACHIEVEMENT_LEVEL_THRESHOLD : '2'
    // change unit to hours
    ACHIEVEMENT_DURATION = BigNumber.from(process.env.ACHIEVEMENT_DURATION ? process.env.ACHIEVEMENT_DURATION : '240').mul(BigNumber.from(60*60)).toString()
    ACHIEVEMENT_REWARD = (process.env.ACHIEVEMENT_REWARD ? process.env.ACHIEVEMENT_REWARD : '1,2,4,6,8,10').split(',')
    for (let index = 0; index < ACHIEVEMENT_REWARD.length; index++) {
        ACHIEVEMENT_REWARD[index] = ethers.utils.parseEther(ACHIEVEMENT_REWARD[index]).toString()
    }

    DURATION = process.env.DURATION ? process.env.DURATION : '86400'
    PERFORMANCE_THRESHOLD = process.env.PERFORMANCE_THRESHOLD ? process.env.PERFORMANCE_THRESHOLD : '20'

    EARLY_BIRD_INIT_CA = process.env.EARLY_BIRD_INIT_CA ? process.env.EARLY_BIRD_INIT_CA : '10000'
    EARLY_BIRD_MINT_START_ID = process.env.EARLY_BIRD_MINT_START_ID ? process.env.EARLY_BIRD_MINT_START_ID : '300000'
    EARLY_BIRD_MINT_END_ID = process.env.EARLY_BIRD_MINT_END_ID ? process.env.EARLY_BIRD_MINT_END_ID : '300200'
    EARLY_BIRD_MINT_PAYMENT = process.env.EARLY_BIRD_MINT_PAYMENT ? process.env.EARLY_BIRD_MINT_PAYMENT : '0x000000000000000000000000000000000000dEaD'
    EARLY_BIRD_MINT_PRICE_IN_PAYMENT = ethers.utils.parseEther(process.env.EARLY_BIRD_MINT_PRICE_IN_PAYMENT ? process.env.EARLY_BIRD_MINT_PRICE_IN_PAYMENT : '5000').toString()
    EARLY_BIRD_MINT_ENABLE = process.env.EARLY_BIRD_MINT_ENABLE === 'true'
    COMMON_MINT_ENABLE = process.env.COMMON_MINT_ENABLE === 'true'
    WL_NUM = process.env.WL_NUM ? process.env.WL_NUM : '20'
    EARLY_BIRD_MINT_WL = process.env.EARLY_BIRD_MINT_WL ? process.env.EARLY_BIRD_MINT_WL.split(',') : [ethers.constants.AddressZero]
    LRT_PRICE_IN_LYNK = process.env.LRT_PRICE_IN_LYNK ? process.env.LRT_PRICE_IN_LYNK : '0'
    TEAM_ADDRESS = process.env.TEAM_ADDRESS ? process.env.TEAM_ADDRESS : ethers.constants.AddressZero

    return {
        environment,
        USDT_ADDRESS,
        MINT_PRICES,
        MAX_MINT_PER_DAY_PER_ADDRESS,
        TOKEN_BASE_URI,
        MAX_VA_ADD_PER_DAY_PER_TOKEN,
        MAX_VA_ADD_PER_DAY_PER_TOKENS,
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
        DURATION,
        PERFORMANCE_THRESHOLD,
        EARLY_BIRD_INIT_CA,
        EARLY_BIRD_MINT_START_ID,
        EARLY_BIRD_MINT_END_ID,
        EARLY_BIRD_MINT_PAYMENT,
        EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
        EARLY_BIRD_MINT_ENABLE,
        COMMON_MINT_ENABLE,
        WL_NUM,
        EARLY_BIRD_MINT_WL,
        LRT_PRICE_IN_LYNK,
        TEAM_ADDRESS,
    }
}

export async function set_up_fixture(fix_name: string) {

    await deployments.fixture([fix_name]);

    const contracts = {
        USDT: (await deployments.get('mock_usdt')).address,
        DBContract: (await deployments.get('DBContract_Proxy')).address,
        APToken: (await deployments.get('APToken_Proxy')).address,
        LRTToken: (await deployments.get('LRTToken_Proxy')).address,
        LYNKNFT: (await deployments.get('LYNKNFT_Proxy')).address,
        sLYNKNFT: (await deployments.get('sLYNKNFT_Proxy')).address,
        lLYNKNFT: (await deployments.get('lLYNKNFT_Proxy')).address,
        User: (await deployments.get('User_Proxy')).address,
        Staking: (await deployments.get('Staking_Proxy')).address,
        Market: (await deployments.get('Market_Proxy')).address,
        LYNKToken: (await deployments.get('LYNKToken_Proxy')).address,
    };


    const USDT = <MockERC20> await (await ethers.getContractFactory("MockERC20")).attach(contracts.USDT)
    const dbContract = <DBContract> await (await ethers.getContractFactory('DBContract')).attach(contracts.DBContract)
    const apToken = <APToken> await (await ethers.getContractFactory('APToken')).attach(contracts.APToken)
    const LRTToken = <LRTToken> await (await ethers.getContractFactory('LRTToken')).attach(contracts.LRTToken)
    const LYNKNFT = <LYNKNFT> await (await ethers.getContractFactory('LYNKNFT')).attach(contracts.LYNKNFT)
    const sLYNKNFT = <BNFT> await (await ethers.getContractFactory('BNFT')).attach(contracts.sLYNKNFT)
    const lLYNKNFT = <BNFT> await (await ethers.getContractFactory('BNFT')).attach(contracts.lLYNKNFT)
    const user = <User> await (await ethers.getContractFactory('User')).attach(contracts.User)
    const staking = <Staking> await (await ethers.getContractFactory('Staking')).attach(contracts.Staking)
    const market = <Market> await (await ethers.getContractFactory('Market')).attach(contracts.Market)
    const LYNKToken = <LYNKToken> await (await ethers.getContractFactory('LYNKToken')).attach(contracts.LYNKNFT)


    return {
        USDT,
        dbContract,
        apToken,
        LRTToken,
        LYNKNFT,
        sLYNKNFT,
        lLYNKNFT,
        user,
        staking,
        market,
        LYNKToken
    };

}

export async function set_up_level(team_addr: string, contracts: CONTRACT_FIX, envs: ENV_FIX, users: USER_FIX, state: CONTRACT_STATE) {
    let elite: SignerWithAddress = await createRandomSignerAndSendETH(users.deployer1)
    let epic: SignerWithAddress = await createRandomSignerAndSendETH(users.deployer1)
    let master: SignerWithAddress = await createRandomSignerAndSendETH(users.deployer1)
    let legendary: SignerWithAddress = await createRandomSignerAndSendETH(users.deployer1)
    let mythic: SignerWithAddress = await createRandomSignerAndSendETH(users.deployer1)
    let divine: SignerWithAddress = await createRandomSignerAndSendETH(users.deployer1)

    await user_level_up(team_addr, users.deployer1, elite, Level.elite, contracts, envs, state, undefined)
    await user_level_up(team_addr, users.deployer1, epic, Level.epic, contracts, envs, state, undefined)
    await user_level_up(team_addr, users.deployer1, master, Level.master, contracts, envs, state, undefined)
    await user_level_up(team_addr, users.deployer1, legendary, Level.legendary, contracts, envs, state, undefined)
    await user_level_up(team_addr, users.deployer1, mythic, Level.mythic, contracts, envs, state, undefined)
    await user_level_up(team_addr, users.deployer1, divine, Level.divine, contracts, envs, state, undefined)

    return {
        signer_by_level: [
            elite,
            epic,
            master,
            legendary,
            mythic,
            divine
        ]
    }
}

export async function set_up_nft_level(team_addr: string, user: SignerWithAddress, contracts: CONTRACT_FIX, envs: ENV_FIX, state: CONTRACT_STATE) {
    await user_level_up(team_addr, user, user, Level.elite, contracts, envs, state, undefined)
    const token_id_by_level = new Array(14)

    for (let index = 0; index < 14; index++) {
        token_id_by_level[index] = await mintLYNKNFTAndCheck(team_addr, user, contracts, envs, state)
        await nft_level_up(token_id_by_level[index], user, index, contracts, envs)
        await increase(24*60*60)
    }

    return {
        token_id_by_level
    }
}

export async function user_level_up(team_addr: string, vault: SignerWithAddress, user: SignerWithAddress, toLevel: Level, contracts: CONTRACT_FIX, envs: ENV_FIX, state: CONTRACT_STATE, ref: string | undefined) {
    let userInfo = await contracts.user.userInfoOf(user.address)
    if (userInfo.refAddress === ethers.constants.AddressZero) {
        userInfo = await registerAndCheck(user, ref ?? envs.ROOT, contracts, state)
    }
    const toLevelNumber = toLevel.valueOf();

    if (toLevelNumber > userInfo.level) {
        const decimalUSDT = await contracts.USDT.decimals()
        const directRequirement = BigNumber.from(envs.DIRECT_REQUIREMENTS[toLevelNumber - 1]).toNumber()
        // const performanceRequirement = BigNumber.from(envs.PERFORMANCE_REQUIREMENTS[toLevelNumber - 1]).add(ethers.utils.parseEther(`${directRequirement}`)).div(directRequirement)
        const performanceRequirement = BigNumber.from(envs.PERFORMANCE_REQUIREMENTS[toLevelNumber - 1]).add(directRequirement)
        const performanceRequirementAmount = performanceRequirement.mul(BigNumber.from(10).pow(decimalUSDT))
        for (let index = 0; index < directRequirement; index++) {
            let childUser;
            let tokenId = -1;
            if (state.INVITEE_LIST.has(user.address)) {
                const inviteeList = state.INVITEE_LIST.get(user.address)
                if (inviteeList && inviteeList.length > index) {
                    childUser = inviteeList[index]
                    await user_level_up(team_addr, vault, childUser, (toLevelNumber - 1 as Level), contracts, envs, state, user.address)
                }
            }

            if (!childUser) {
                childUser = await createRandomSignerAndSendETH(vault)
                await user_level_up(team_addr, vault, childUser, (toLevelNumber - 1 as Level), contracts, envs, state, user.address)
            }
            if ((await contracts.LYNKNFT.balanceOf(childUser.address)).gt(0)) {
                tokenId = (await contracts.LYNKNFT.tokenOfOwnerByIndex(childUser.address, 0)).toNumber()
            }
            // if (tokenId == -1)
            //     tokenId = await mintLYNKNFTAndCheck(team_addr, childUser, contracts, envs, state)
            //
            // await contracts.USDT.connect(childUser).mint(childUser.address, performanceRequirement)
            // await contracts.USDT.connect(childUser).approve(contracts.LYNKNFT.address, performanceRequirement)
            //
            // await contracts.LYNKNFT.connect(childUser).upgrade(0, tokenId, performanceRequirement.div(BigNumber.from(10).pow(decimalUSDT)), contracts.USDT.address)

            if (index == 0) {
                if (tokenId == -1)
                    tokenId = await mintLYNKNFTAndCheck(team_addr, childUser, contracts, envs, state)

                await contracts.USDT.connect(childUser).mint(childUser.address, performanceRequirementAmount)
                await contracts.USDT.connect(childUser).approve(contracts.LYNKNFT.address, performanceRequirementAmount)

                await contracts.LYNKNFT.connect(childUser).upgrade(0, tokenId, performanceRequirementAmount.div(BigNumber.from(10).pow(decimalUSDT)), contracts.USDT.address)
            }
        }
    }

    await auditLevel(user, contracts, state)
    userInfo = await contracts.user.userInfoOf(user.address)
    expect(userInfo.level).to.equal(toLevelNumber)
}

export async function auditLevel(user: SignerWithAddress, contracts: CONTRACT_FIX, state: CONTRACT_STATE) {
    // const inviteeList = state.INVITEE_LIST.get(user.address)
    // if (inviteeList && inviteeList.length > 0) {
    //     for (let index = 0; index < inviteeList.length; index++) {
    //         await auditLevel(inviteeList[index], contracts, state)
    //         await contracts.user.auditLevel(inviteeList[index].address)
    //     }
    //     await contracts.user.auditLevel(user.address)
    // }
    while (await contracts.user.levelUpAble(user.address)) {
        const tx = await contracts.user.auditLevel(user.address)
        await tx.wait()
    }
}

export async function nft_level_up(tokenId: number, user: SignerWithAddress, toLevel: number, contracts: CONTRACT_FIX, envs: ENV_FIX) {
    expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(user.address)

    if (toLevel > 0) {
        const nftInfo = await contracts.LYNKNFT.nftInfoOf(tokenId)
        expect(nftInfo.length).to.equal(4)

        const decimalUSDT = await contracts.USDT.decimals()
        const decimalAPT = await contracts.apToken.decimals()

        const charismaThreshold = BigNumber.from(envs.ATTRIBUTE_CA[toLevel - 1]).sub(nftInfo[Attribute.charisma.valueOf()])
        const charismaThresholdNeedAmount = charismaThreshold.mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(user).mint(user.address, charismaThresholdNeedAmount)
        await contracts.USDT.connect(user).approve(contracts.LYNKNFT.address, charismaThresholdNeedAmount)
        await contracts.LYNKNFT.connect(user).upgrade(Attribute.charisma.valueOf(), tokenId, charismaThreshold, contracts.USDT.address)

        const vitalityThreshold = BigNumber.from(envs.ATTRIBUTE_VA[toLevel - 1]).sub(nftInfo[Attribute.vitality.valueOf()])
        const vitalityThresholdNeedAmount = vitalityThreshold.mul(BigNumber.from(10).pow(decimalAPT))

        const intellectThreshold = BigNumber.from(envs.ATTRIBUTE_IN[toLevel - 1]).sub(nftInfo[Attribute.intellect.valueOf()])
        const intellectThresholdAmount = intellectThreshold.mul(BigNumber.from(10).pow(decimalAPT))

        const dexterityThreshold = BigNumber.from(envs.ATTRIBUTE_DX[toLevel - 1]).sub(nftInfo[Attribute.dexterity.valueOf()])
        const dexterityThresholdNeedAmount = dexterityThreshold.mul(BigNumber.from(10).pow(decimalAPT))

        const totalAPT = dexterityThresholdNeedAmount.add(vitalityThresholdNeedAmount).add(intellectThresholdAmount)
        const maxPackage = envs.AP_PACKAGE[envs.AP_PACKAGE.length - 1]
        const needPackageNum = totalAPT.div(BigNumber.from(maxPackage[2])).add(1).toNumber()

        for (let index = 0; index < needPackageNum; index++) {
            // @ts-ignore
            await contracts.apToken.connect(user)["mint(uint256)"](envs.AP_PACKAGE.length - 1, {value: BigNumber.from(maxPackage[1])})
        }

        await contracts.apToken.connect(user).approve(contracts.LYNKNFT.address, totalAPT)
        await contracts.LYNKNFT.connect(user).upgrade(Attribute.vitality.valueOf(), tokenId, vitalityThreshold, contracts.apToken.address)
        await contracts.LYNKNFT.connect(user).upgrade(Attribute.intellect.valueOf(), tokenId, intellectThreshold, contracts.apToken.address)
        await contracts.LYNKNFT.connect(user).upgrade(Attribute.dexterity.valueOf(), tokenId, dexterityThreshold, contracts.apToken.address)
    }

    const level = await contracts.dbContract.calcTokenLevel(tokenId)
    expect(level).to.equal(toLevel)
}

export async function registerAndCheck(user: SignerWithAddress, refAddress: string, contracts: CONTRACT_FIX, state: CONTRACT_STATE) {
    await contracts.user.connect(user).register(refAddress)
    const userInfo = await contracts.user.userInfoOf(user.address)
    expect(userInfo.level).to.equal(Level.elite.valueOf())
    expect(userInfo.refAddress).to.equal(refAddress)

    if (!state.INVITEE_LIST.has(refAddress)) {
        state.INVITEE_LIST.set(refAddress, [])
    }
    (state.INVITEE_LIST.get(refAddress) as SignerWithAddress[]).push(user)

    return userInfo
}

export async function mintLYNKNFTAndCheck(team_addr: string, user: SignerWithAddress, contracts: CONTRACT_FIX, envs: ENV_FIX, state: CONTRACT_STATE) {
    const decimalUSDT = await contracts.USDT.decimals()
    const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalUSDT))
    await contracts.USDT.connect(user).mint(user.address, mintPrice)
    await contracts.USDT.connect(user).approve(contracts.LYNKNFT.address, mintPrice)

    const tokenId = state.LYNKNFT_TOKEN_ID
    const tx = await contracts.LYNKNFT.connect(user).mint(tokenId, contracts.USDT.address, `name-${state.LYNKNFT_TOKEN_ID}`)
    await expect(tx)
        .to.emit(contracts.USDT, 'Transfer')
        .withArgs(user.address, team_addr, mintPrice)
    await expect(tx)
        .to.emit(contracts.LYNKNFT, 'Transfer')
        .withArgs(ethers.constants.AddressZero, user.address, tokenId)
    expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(user.address)

    state.LYNKNFT_TOKEN_ID = state.LYNKNFT_TOKEN_ID.add(1)

    return tokenId.toNumber()
}

export async function transferLYNKNFTAndCheck(from: SignerWithAddress, to: string, tokenId: BigNumberish, contracts: CONTRACT_FIX) {
    const tx = await contracts.LYNKNFT.connect(from).transferFrom(
        from.address,
        to,
        tokenId
    )
    await expect(tx)
        .to.emit(contracts.LYNKNFT, 'Transfer')
        .withArgs(from.address, to, tokenId)
    expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(to)
}

export async function createRandomSignerAndSendETH(vault: SignerWithAddress) {
    // @ts-ignore
    const randomSigner = await SignerWithAddress.create(ethers.Wallet.createRandom().connect(ethers.provider))
    const tx = await vault.sendTransaction({
        to: randomSigner.address,
        value: ethers.utils.parseEther('10000')
    })
    await tx.wait()

    return randomSigner
}
