import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ENV_FIX, get_env, get_user, USER_FIX} from "../test/start_up";
import {DBContract, DBContract__factory} from "../typechain-types";
import {Attribute, PROD_EVN} from "../constants/constants";
import {Deployment} from "hardhat-deploy/dist/types";
import {DeployFunction} from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre
    let users: USER_FIX = await get_user()
    const env: ENV_FIX = get_env();

    const deploymentsDBContract: Deployment = await deployments.get("DBContract_Proxy")
    // @ts-ignore
    const dbContractFactory: DBContract__factory = await hre.ethers.getContractFactory('DBContract')
    const dbProxyAttached: DBContract = await dbContractFactory.attach(deploymentsDBContract.address)

    let tx;

    if ((await dbProxyAttached.operator()).toLowerCase() != users.operator.address.toLowerCase()) {
        console.log('setup the operator...')
        tx = await dbProxyAttached.connect(users.owner1).setOperator(users.operator.address)
        await tx.wait()
    }

    let isMatch, parametersLength
    parametersLength = (await dbProxyAttached.mintPricesNum()).toNumber()
    isMatch = parametersLength == env.MINT_PRICES.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            const price = await dbProxyAttached.mintPrices(index)
            if (!price.eq(env.MINT_PRICES[index])) {
                isMatch = false
                break
            }
        }
    }
    if (!isMatch) {
        console.log('setup the mint prices...')
        tx = await dbProxyAttached.connect(users.operator).setMintPrices(env.MINT_PRICES)
        await tx.wait()
    }

    if (!(await dbProxyAttached.maxMintPerDayPerAddress()).eq(env.MAX_MINT_PER_DAY_PER_ADDRESS)) {
        console.log('setup the max mint limit...')
        tx = await dbProxyAttached.connect(users.operator).setMaxMintPerDayPerAddress(env.MAX_MINT_PER_DAY_PER_ADDRESS)
        await tx.wait()
    }

    if (!(await dbProxyAttached.maxVAAddPerDayPerToken()).eq(env.MAX_VA_ADD_PER_DAY_PER_TOKEN)) {
        console.log('setup the max va added...')
        let value = env.MAX_VA_ADD_PER_DAY_PER_TOKEN
        if (env.environment !== PROD_EVN) {
            value = ethers.constants.MaxUint256.toString()
        }

        tx = await dbProxyAttached.connect(users.operator).setMaxVAAddPerDayPerToken(value)
        await tx.wait()
    }

    const attrs = [env.ATTRIBUTE_CA, env.ATTRIBUTE_VA, env.ATTRIBUTE_IN, env.ATTRIBUTE_DX]
    for (let indexOuter = 0; indexOuter < Attribute.dexterity.valueOf() + 1; indexOuter++) {
        parametersLength = (await dbProxyAttached.attributeLevelThresholdNum()).toNumber()
        isMatch = parametersLength > indexOuter
        if (isMatch) {
            parametersLength = (await dbProxyAttached.attributeLevelThresholdNumByIndex(indexOuter)).toNumber()
            isMatch = parametersLength == env.ATTRIBUTE_CA.length
            if (isMatch) {
                for (let indexInner = 0; indexInner < parametersLength; indexInner++) {
                    const threshold = await dbProxyAttached.attributeLevelThreshold(indexOuter, indexInner)
                    if (!threshold.eq(attrs[indexOuter][indexInner])) {
                        isMatch = false
                        break
                    }
                }
            }
        }
        if (!isMatch) {
            console.log(`setup ${indexOuter} level threshold...`)
            tx = await dbProxyAttached.connect(users.operator).setAttributeLevelThreshold(indexOuter, attrs[indexOuter])
            await tx.wait()
        }
    }

    let USDTAddress = env.USDT_ADDRESS
    if (env.environment == 'test') {
        const deploymentsMockUSDT = await deployments.get("mock_usdt")
        USDTAddress = deploymentsMockUSDT.address
    }

    if (!(await dbProxyAttached.isAcceptToken(USDTAddress))) {
        console.log('accept USDT...')
        tx = await dbProxyAttached.connect(users.operator).setAcceptToken(USDTAddress)
        await tx.wait()
    }
    if (!(await dbProxyAttached.isAcceptToken(ethers.constants.AddressZero))) {
        console.log('accept origin token...')
        tx = await dbProxyAttached.connect(users.operator).setAcceptToken(ethers.constants.AddressZero)
        await tx.wait()
    }

    if (!(await dbProxyAttached.sellingLevelLimit()).eq(env.SELLING_LEVEL_LIMIT)) {
        console.log('setup selling level limit...')
        tx = await dbProxyAttached.connect(users.operator).setSellingLevelLimit(env.SELLING_LEVEL_LIMIT)
        await tx.wait()
    }
    if (!(await dbProxyAttached.tradingFee()).eq(env.TRADING_FEE)) {
        console.log('setup trading fee...')
        tx = await dbProxyAttached.connect(users.operator).setTradingFee(env.TRADING_FEE)
        await tx.wait()
    }
    if ((await dbProxyAttached.rootAddress()).toLowerCase() !== env.ROOT.toLowerCase()) {
        console.log('setup root address..')
        tx = await dbProxyAttached.connect(users.operator).setRootAddress(env.ROOT)
        await tx.wait()
    }

    parametersLength = (await dbProxyAttached.directRequirementsNum()).toNumber()
    isMatch = parametersLength == env.DIRECT_REQUIREMENTS.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            const requirement = await dbProxyAttached.directRequirements(index)
            if (!requirement.eq(env.DIRECT_REQUIREMENTS[index])) {
                isMatch = false
                break
            }
        }
    }
    if (!isMatch) {
        console.log('setup direct requirements...')
        tx = await dbProxyAttached.connect(users.operator).setDirectRequirements(env.DIRECT_REQUIREMENTS)
        await tx.wait()
    }

    parametersLength = (await dbProxyAttached.performanceRequirementsNum()).toNumber()
    isMatch = parametersLength == env.PERFORMANCE_REQUIREMENTS.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            const requirement = await dbProxyAttached.performanceRequirements(index)
            if (!requirement.eq(env.PERFORMANCE_REQUIREMENTS[index])) {
                isMatch = false
                break
            }
        }
    }
    if (!isMatch) {
        console.log('setup performance requirements...')
        tx = await dbProxyAttached.connect(users.operator).setPerformanceRequirements(env.PERFORMANCE_REQUIREMENTS)
        await tx.wait()
    }

    parametersLength = (await dbProxyAttached.socialRewardRatesNum()).toNumber()
    isMatch = parametersLength == env.SOCIAL_REWARD.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            const rate = await dbProxyAttached.socialRewardRates(index)
            if (!rate.eq(env.SOCIAL_REWARD[index])) {
                isMatch = false
                break
            }
        }
    }
    if (!isMatch) {
        console.log('setup social reward rates...')
        tx = await dbProxyAttached.connect(users.operator).setSocialRewardRates(env.SOCIAL_REWARD)
        await tx.wait()
    }

    if (!(await dbProxyAttached.contributionRewardThreshold()).eq(env.CONTRIBUTION_THRESHOLD)) {
        console.log('setup contribution reward threshold...')
        tx = await dbProxyAttached.connect(users.operator).setContributionRewardThreshold(env.CONTRIBUTION_THRESHOLD)
        await tx.wait()
    }

    parametersLength = (await dbProxyAttached.contributionRewardAmountsNum()).toNumber()
    isMatch = parametersLength == env.CONTRIBUTION_REWARD.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            const amount = await dbProxyAttached.contributionRewardAmounts(index)
            if (!amount.eq(env.CONTRIBUTION_REWARD[index])) {
                isMatch = false
                break
            }
        }
    }
    if (!isMatch) {
        console.log('setup contribution reward amount...')
        tx = await dbProxyAttached.connect(users.operator).setContributionRewardAmounts(env.CONTRIBUTION_REWARD)
        await tx.wait()
    }

    for (let indexOuter = 0; indexOuter < env.COMMUNITY_REWARD.length; indexOuter++) {
        parametersLength = (await dbProxyAttached.communityRewardRatesNumByLevel(indexOuter)).toNumber()
        isMatch = parametersLength == env.COMMUNITY_REWARD[indexOuter].length
        if (isMatch) {
            for (let indexInner = 0; indexInner < parametersLength; indexInner++) {
                const reward = await dbProxyAttached.communityRewardRates(indexOuter, indexInner)
                if (!reward.eq(env.COMMUNITY_REWARD[indexOuter][indexInner])) {
                    isMatch = false
                    break
                }
            }
        }
        if (!isMatch) {
            console.log(`setup ${indexOuter} community reward...`)
            tx = await dbProxyAttached.connect(users.operator).setCommunityRewardRates(indexOuter, env.COMMUNITY_REWARD[indexOuter])
            await tx.wait()
        }
    }

    if (!(await dbProxyAttached.achievementRewardLevelThreshold()).eq(env.ACHIEVEMENT_LEVEL_THRESHOLD)) {
        console.log('setup achievement reward level threshold...')
        tx = await dbProxyAttached.connect(users.operator).setAchievementRewardLevelThreshold(env.ACHIEVEMENT_LEVEL_THRESHOLD)
        await tx.wait()
    }

    if (!(await dbProxyAttached.achievementRewardDurationThreshold()).eq(env.ACHIEVEMENT_DURATION)) {
        console.log('setup achievement reward duration threshold...')
        tx = await dbProxyAttached.connect(users.operator).setAchievementRewardDurationThreshold(env.ACHIEVEMENT_DURATION)
        await tx.wait()
    }

    parametersLength = (await dbProxyAttached.achievementRewardAmountsNum()).toNumber()
    isMatch = parametersLength == env.ACHIEVEMENT_REWARD.length
    if (isMatch) {
        for (let index = 0; index > parametersLength; index++) {
            const reward = await dbProxyAttached.achievementRewardAmounts(index)
            if (!reward.eq(env.ACHIEVEMENT_REWARD[index])) {
                isMatch = false
                break
            }
        }
    }
    if (!isMatch) {
        console.log('setup achievement reward amounts...')
        tx = await dbProxyAttached.connect(users.operator).setAchievementRewardAmounts(env.ACHIEVEMENT_REWARD)
        await tx.wait()
    }

    parametersLength = (await dbProxyAttached.packageLength()).toNumber()
    isMatch = parametersLength == env.AP_PACKAGE.length
    if (isMatch) {
        for (let indexOuter = 0; indexOuter < env.AP_PACKAGE.length; indexOuter++) {
            const packagee = await dbProxyAttached.packageByIndex(indexOuter)
            for (let indexInner = 0; indexInner < packagee.length; indexInner++) {
                if (!packagee[indexInner].eq(env.AP_PACKAGE[indexOuter][indexInner])) {
                    isMatch = false
                    break
                }
            }
            if (!isMatch) break
        }
    }
    if (!isMatch) {
        console.log('setup APToken selling package...')
        tx = await dbProxyAttached.connect(users.operator).setSellingPackage(env.AP_PACKAGE)
        await tx.wait()
    }
}

export default func
func.tags = ['setup_env']
func.dependencies = ['test_net']
