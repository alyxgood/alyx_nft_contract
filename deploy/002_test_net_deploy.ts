import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DBContract, MockERC20} from "../typechain-types";
import {ENV_FIX, get_user, get_env, USER_FIX} from "../test/start_up";
import {use} from "chai";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre
    const {deploy} = deployments
    let users: USER_FIX = await get_user()

    const mockUSDTAddress = (await deployments.get('mock_usdt')).address
    const mockAPTokenAddress = (await deployments.get('mock_ap_token')).address
    const mockLYNKTokenAddress = (await deployments.get('mock_lynk_token')).address

    let initData = '0x'
    // deploy db logic
    const dbLogic = await deploy(
        'DBContract_Logic',
        {
            from: users.deployer1.address,
            args: [mockUSDTAddress],
            log: true,
            contract: 'DBContract'
        }
    )

    const dbProxy = await deploy(
        'DBContract_Proxy',
        {
            from: users.owner1.address,
            args: [dbLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    const lxnkNFTLogic = await deploy(
        'LYNKNFT_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'LYNKNFT'
        }
    )

    const LYNKNFT = await ethers.getContractFactory('LYNKNFT')
    initData = LYNKNFT.interface.encodeFunctionData('__LYNKNFT_init')
    const lynkNFTProxy = await deploy(
        'LYNKNFT_Proxy',
        {
            from: users.owner1.address,
            args: [lxnkNFTLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    const BNFT = await ethers.getContractFactory('BNFT')
    const bTokenLogic = await deploy(
        'BNFT_Logic',
        {
            from: users.deployer1.address,
            log: true,
            contract: 'BNFT'
        }
    )

    initData = BNFT.interface.encodeFunctionData(
        'initialize',
        [
            lynkNFTProxy.address,
            'Staking LYNK',
            'sLYNK'
        ]
    )
    const sLYNKNFTProxy = await deploy(
        'sLYNKNFT_Proxy',
        {
            from: users.owner1.address,
            args: [bTokenLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    initData = BNFT.interface.encodeFunctionData(
        'initialize',
        [
            lynkNFTProxy.address,
            'List LYNK',
            'lLYNK'
        ]
    )
    const lLYNKTokenProxy = await deploy(
        'lLYNKNFT_Proxy',
        {
            from: users.owner1.address,
            args: [bTokenLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // deploy user
    const userLogic = await deploy(
        'User_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'User'
        }
    )

    const User = await ethers.getContractFactory('User')
    initData = User.interface.encodeFunctionData('__User_init')
    const userProxy = await deploy(
        'User_Proxy',
        {
            from: users.owner1.address,
            args: [userLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // deploy staking
    const stakingLogic = await deploy(
        'Staking_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'Staking'
        }
    )

    const Staking = await ethers.getContractFactory('Staking')
    initData = Staking.interface.encodeFunctionData('__Staking_init')
    const stakingProxy = await deploy(
        'Staking_Proxy',
        {
            from: users.owner1.address,
            args: [stakingLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // deploy market
    const marketLogic = await deploy(
        'Market_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'Market'
        }
    )

    const Market = await ethers.getContractFactory('Market')
    initData = Market.interface.encodeFunctionData('__Market_init')
    const marketProxy = await deploy(
        'Market_Proxy',
        {
            from: users.owner1.address,
            args: [marketLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // init db contract
    let tx;
    const env: ENV_FIX = get_env();
    let dbProxyAttached = <DBContract> await (await ethers.getContractFactory('DBContract')).attach(dbProxy.address)
    try {
        tx = await dbProxyAttached.connect(users.owner1).__DBContract_init([
            mockLYNKTokenAddress,
            mockAPTokenAddress,
            stakingProxy.address,
            lynkNFTProxy.address,
            sLYNKNFTProxy.address,
            lLYNKTokenProxy.address,
            marketProxy.address,
            userProxy.address,
            users.team_addr.address,
        ])
        await tx.wait()

        tx = await dbProxyAttached.connect(users.owner1).setOperator(users.operator.address)
        await tx.wait()

        await dbProxyAttached.connect(users.operator).setMintPrices(env.MINT_PRICES)
        tx = await dbProxyAttached.connect(users.operator).setMaxMintPerDayPerAddress(env.MAX_MINT_PER_DAY_PER_ADDRESS)
        await tx.wait()

        await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold('0', env.ATTRIBUTE_VA)
        await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold('1', env.ATTRIBUTE_IN)
        await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold('2', env.ATTRIBUTE_DX)
        await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold('3', env.ATTRIBUTE_CA)

        await dbProxyAttached.connect(users.operator).setAcceptToken(mockUSDTAddress)
        await dbProxyAttached.connect(users.operator).setAcceptToken(ethers.constants.AddressZero)

        await dbProxyAttached.connect(users.operator).setSellingLevelLimit(env.SELLING_LEVEL_LIMIT)
        await dbProxyAttached.connect(users.operator).setTradingFee(env.TRADING_FEE)
        await dbProxyAttached.connect(users.operator).setRootAddress(env.ROOT)
        await dbProxyAttached.connect(users.operator).setDirectRequirements(env.DIRECT_REQUIREMENTS)
        await dbProxyAttached.connect(users.operator).setPerformanceRequirements(env.PERFORMANCE_REQUIREMENTS)
        await dbProxyAttached.connect(users.operator).setSocialRewardRates(env.SOCIAL_REWARD)
        await dbProxyAttached.connect(users.operator).setContributionRewardThreshold(env.CONTRIBUTION_THRESHOLD)
        await dbProxyAttached.connect(users.operator).setContributionRewardAmounts(env.CONTRIBUTION_REWARD)

        for (let index = 0; index < env.COMMUNITY_REWARD.length; index++) {
            await dbProxyAttached.connect(users.operator).setCommunityRewardRates(index, env.COMMUNITY_REWARD[index])
        }

        await dbProxyAttached.connect(users.operator).setAchievementRewardLevelThreshold(env.ACHIEVEMENT_LEVEL_THRESHOLD)
        await dbProxyAttached.connect(users.operator).setAchievementRewardDurationThreshold(env.ACHIEVEMENT_DURATION)
        await dbProxyAttached.connect(users.operator).setAchievementRewardAmounts(env.ACHIEVEMENT_REWARD)
    } catch (e: any) {
        console.log(e.reason)
    }
}

export default func
func.tags = ['test_net']
func.dependencies = ['MockERC20']
