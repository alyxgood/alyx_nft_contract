import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DBContract, MockERC20} from "../typechain-types";
import {ENV_FIX, get_user, get_env, USER_FIX} from "../test/start_up";
import {Attribute} from "../constants/constants";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre
    const {deploy} = deployments
    let users: USER_FIX = await get_user()

    const mockUSDTAddress = (await deployments.get('mock_usdt')).address

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

    // deploy tokens
    const apTokenLogic = await deploy(
        'APToken_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'APToken'
        }
    )

    const APToken = await ethers.getContractFactory('APToken')
    initData = APToken.interface.encodeFunctionData('__APToken_init')
    const apTokenProxy = await deploy(
        'APToken_Proxy',
        {
            from: users.owner1.address,
            args: [apTokenLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    const lynkTokenLogic = await deploy(
        'LYNKToken_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'LYNKToken'
        }
    )

    const LYNKToken = await ethers.getContractFactory('LYNKToken')
    initData = LYNKToken.interface.encodeFunctionData('__LYNKToken_init')
    const lynkTokenProxy = await deploy(
        'LYNKToken_Proxy',
        {
            from: users.owner1.address,
            args: [lynkTokenLogic.address, users.proxy_admin1.address, initData],
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
    try {
        const env: ENV_FIX = get_env();
        let dbProxyAttached = <DBContract> await (await ethers.getContractFactory('DBContract')).attach(dbProxy.address)
        if (await dbProxyAttached.LYNKNFT() === ethers.constants.AddressZero) {
            console.log('init the db contract...')
            tx = await dbProxyAttached.connect(users.owner1).__DBContract_init([
                lynkTokenProxy.address,
                apTokenProxy.address,
                stakingProxy.address,
                lynkNFTProxy.address,
                sLYNKNFTProxy.address,
                lLYNKTokenProxy.address,
                marketProxy.address,
                userProxy.address,
                users.team_addr.address,
            ])
            await tx.wait()
        }

        if (await dbProxyAttached.operator() === ethers.constants.AddressZero) {
            console.log('setup the operator...')
            tx = await dbProxyAttached.connect(users.owner1).setOperator(users.operator.address)
            await tx.wait()
        }

        if ((await dbProxyAttached.mintPricesNum()).eq(0)) {
            console.log('setup the mint prices...')
            tx = await dbProxyAttached.connect(users.operator).setMintPrices(env.MINT_PRICES)
            await tx.wait()
        }

        if ((await dbProxyAttached.maxMintPerDayPerAddress()).eq(0)) {
            console.log('setup the max mint limit...')
            tx = await dbProxyAttached.connect(users.operator).setMaxMintPerDayPerAddress(env.MAX_MINT_PER_DAY_PER_ADDRESS)
            await tx.wait()
        }

        if ((await dbProxyAttached.attributeLevelThresholdNum()).eq(Attribute.charisma.valueOf())) {
            console.log('setup charisma level threshold...')
            tx = await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold(Attribute.charisma.valueOf(), env.ATTRIBUTE_CA)
            await tx.wait()
        }
        if ((await dbProxyAttached.attributeLevelThresholdNum()).eq(Attribute.vitality.valueOf())) {
            console.log('setup vitality level threshold...')
            tx = await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold(Attribute.vitality.valueOf(), env.ATTRIBUTE_VA)
            await tx.wait()
        }
        if ((await dbProxyAttached.attributeLevelThresholdNum()).eq(Attribute.intellect.valueOf())) {
            console.log('setup intellect level threshold...')
            tx = await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold(Attribute.intellect.valueOf(), env.ATTRIBUTE_IN)
            await tx.wait()
        }
        if ((await dbProxyAttached.attributeLevelThresholdNum()).eq(Attribute.dexterity.valueOf())) {
            console.log('setup dexterity level threshold...')
            tx = await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold(Attribute.dexterity.valueOf(), env.ATTRIBUTE_DX)
            await tx.wait()
        }

        if (!(await dbProxyAttached.isAcceptToken(mockUSDTAddress))) {
            console.log('accept mock USDT...')
            tx = await dbProxyAttached.connect(users.operator).setAcceptToken(mockUSDTAddress)
            await tx.wait()
        }
        if (!(await dbProxyAttached.isAcceptToken(ethers.constants.AddressZero))) {
            console.log('accept origin token...')
            tx = await dbProxyAttached.connect(users.operator).setAcceptToken(ethers.constants.AddressZero)
            await tx.wait()
        }

        if ((await dbProxyAttached.sellingLevelLimit()).eq(0)) {
            console.log('setup selling level limit...')
            tx = await dbProxyAttached.connect(users.operator).setSellingLevelLimit(env.SELLING_LEVEL_LIMIT)
            await tx.wait()
        }
        if ((await dbProxyAttached.tradingFee()).eq(0)) {
            console.log('setup trading fee...')
            tx = await dbProxyAttached.connect(users.operator).setTradingFee(env.TRADING_FEE)
            await tx.wait()
        }
        if (await dbProxyAttached.rootAddress() === ethers.constants.AddressZero) {
            console.log('setup root address..')
            tx = await dbProxyAttached.connect(users.operator).setRootAddress(env.ROOT)
            await tx.wait()
        }
        if ((await dbProxyAttached.directRequirementsNum()).eq(0)) {
            console.log('setup direct requirements...')
            tx = await dbProxyAttached.connect(users.operator).setDirectRequirements(env.DIRECT_REQUIREMENTS)
            await tx.wait()
        }
        if ((await dbProxyAttached.performanceRequirementsNum()).eq(0)) {
            console.log('setup performance requirements...')
            tx = await dbProxyAttached.connect(users.operator).setPerformanceRequirements(env.PERFORMANCE_REQUIREMENTS)
            await tx.wait()
        }
        if ((await dbProxyAttached.socialRewardRatesNum()).eq(0)) {
            console.log('setup social reward rates...')
            tx = await dbProxyAttached.connect(users.operator).setSocialRewardRates(env.SOCIAL_REWARD)
            await tx.wait()
        }
        if ((await dbProxyAttached.contributionRewardThreshold()).eq(0)) {
            console.log('setup contribution reward threshold...')
            tx = await dbProxyAttached.connect(users.operator).setContributionRewardThreshold(env.CONTRIBUTION_THRESHOLD)
            await tx.wait()
        }
        if ((await dbProxyAttached.contributionRewardAmountsNum()).eq(0)) {
            console.log('setup contribution reward amount...')
            tx = await dbProxyAttached.connect(users.operator).setContributionRewardAmounts(env.CONTRIBUTION_REWARD)
            await tx.wait()
        }

        for (let index = 0; index < env.COMMUNITY_REWARD.length; index++) {
            if ((await dbProxyAttached.communityRewardRatesNumByLevel(index)).eq(0)) {
                console.log(`setup ${index} community reward...`)
                tx = await dbProxyAttached.connect(users.operator).setCommunityRewardRates(index, env.COMMUNITY_REWARD[index])
                await tx.wait()
            }
        }

        if ((await dbProxyAttached.achievementRewardLevelThreshold()).eq(0)) {
            console.log('setup achievement reward level threshold...')
            tx = await dbProxyAttached.connect(users.operator).setAchievementRewardLevelThreshold(env.ACHIEVEMENT_LEVEL_THRESHOLD)
            await tx.wait()
        }
        if ((await dbProxyAttached.achievementRewardDurationThreshold()).eq(0)) {
            console.log('setup achievement reward duration threshold...')
            tx = await dbProxyAttached.connect(users.operator).setAchievementRewardDurationThreshold(env.ACHIEVEMENT_DURATION)
            await tx.wait()
        }
        if ((await dbProxyAttached.achievementRewardAmountsNum()).eq(0)) {
            console.log('setup achievement reward amounts...')
            tx = await dbProxyAttached.connect(users.operator).setAchievementRewardAmounts(env.ACHIEVEMENT_REWARD)
            await tx.wait()
        }

        if ((await dbProxyAttached.packageLength()).eq(0)) {
            console.log('setup APToken selling package...')
            tx = await dbProxyAttached.connect(users.operator).setSellingPackage(env.AP_PACKAGE)
            await tx.wait()
        }
    } catch (e: any) {
        console.log(e)
    }
}

export default func
func.tags = ['test_net']
func.dependencies = ['MockERC20']
