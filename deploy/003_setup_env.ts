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

    console.log('fetching operator...')
    if ((await dbProxyAttached.operator()).toLowerCase() != users.operator.address.toLowerCase()) {
        console.log('setup the operator...')
        tx = await dbProxyAttached.connect(users.owner1).setOperator(users.operator.address)
        await tx.wait()
    }

    let isMatch, parametersLength
    console.log(`fetching mintPricesNum...`)
    parametersLength = (await dbProxyAttached.mintPricesNum()).toNumber()
    isMatch = parametersLength == env.MINT_PRICES.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            console.log(`fetching mintPrices ${index}...`)
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

    console.log(`fetching maxMintPerDayPerAddress...`)
    if (!(await dbProxyAttached.maxMintPerDayPerAddress()).eq(env.MAX_MINT_PER_DAY_PER_ADDRESS)) {
        console.log('setup the max mint limit...')
        tx = await dbProxyAttached.connect(users.operator).setMaxMintPerDayPerAddress(env.MAX_MINT_PER_DAY_PER_ADDRESS)
        await tx.wait()
    }

    console.log(`fetching baseTokenURI...`)
    if (await dbProxyAttached.baseTokenURI() !== env.TOKEN_BASE_URI) {
        console.log('setup the base uri...')
        tx = await dbProxyAttached.connect(users.operator).setBaseTokenURI(env.TOKEN_BASE_URI)
        await tx.wait()
    }

    console.log(`fetching maxVAAddPerDayPerToken...`)
    if (!(await dbProxyAttached.maxVAAddPerDayPerToken()).eq(env.MAX_VA_ADD_PER_DAY_PER_TOKEN)) {
        console.log('setup the max va added...')
        let value = env.MAX_VA_ADD_PER_DAY_PER_TOKEN
        if (env.environment !== PROD_EVN) {
            value = ethers.constants.MaxUint256.toString()
        }

        tx = await dbProxyAttached.connect(users.operator).setMaxVAAddPerDayPerToken(value)
        await tx.wait()
    }

    console.log(`fetching maxVAAddPerDayPerTokensNum...`)
    parametersLength = (await dbProxyAttached.maxVAAddPerDayPerTokensNum()).toNumber()
    isMatch = parametersLength == env.MAX_VA_ADD_PER_DAY_PER_TOKENS.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            console.log(`fetching maxVAAddPerDayPerTokens ${index}...`)
            const maxVAAddPerDayPerToken = await dbProxyAttached.maxVAAddPerDayPerTokens(index)
            if (!maxVAAddPerDayPerToken.eq(env.MAX_VA_ADD_PER_DAY_PER_TOKENS[index])) {
                isMatch = false
                break
            }
        }
    }
    if (!isMatch) {
        console.log('setup the maxVAAddPerDayPerTokens...')
        let values = env.MAX_VA_ADD_PER_DAY_PER_TOKENS
        if (env.environment !== PROD_EVN) {
            for (let index = 0; index < values.length; index++) {
                values[index] = ethers.constants.MaxUint256.toString()
            }
        }
        tx = await dbProxyAttached.connect(users.operator).setMaxVAAddPerDayPerTokens(values)
        await tx.wait()
    }

    const attrs = [env.ATTRIBUTE_CA, env.ATTRIBUTE_VA, env.ATTRIBUTE_IN, env.ATTRIBUTE_DX]
    for (let indexOuter = 0; indexOuter < Attribute.dexterity.valueOf() + 1; indexOuter++) {
        console.log(`fetching attributeLevelThresholdNum ${indexOuter}...`)
        parametersLength = (await dbProxyAttached.attributeLevelThresholdNum()).toNumber()
        isMatch = parametersLength > indexOuter
        if (isMatch) {
            console.log(`fetching attributeLevelThresholdNumByIndex ${indexOuter}...`)
            parametersLength = (await dbProxyAttached.attributeLevelThresholdNumByIndex(indexOuter)).toNumber()
            isMatch = parametersLength == env.ATTRIBUTE_CA.length
            if (isMatch) {
                for (let indexInner = 0; indexInner < parametersLength; indexInner++) {
                    console.log(`fetching attributeLevelThreshold ${indexInner}...`)
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

    console.log(`fetching isAcceptToken USDT...`)
    if (!(await dbProxyAttached.isAcceptToken(USDTAddress))) {
        console.log('accept USDT...')
        tx = await dbProxyAttached.connect(users.operator).setAcceptToken(USDTAddress)
        await tx.wait()
    }
    console.log(`fetching isAcceptToken zero...`)
    if (!(await dbProxyAttached.isAcceptToken(ethers.constants.AddressZero))) {
        console.log('accept origin token...')
        tx = await dbProxyAttached.connect(users.operator).setAcceptToken(ethers.constants.AddressZero)
        await tx.wait()
    }

    console.log(`fetching sellingLevelLimit...`)
    if (!(await dbProxyAttached.sellingLevelLimit()).eq(env.SELLING_LEVEL_LIMIT)) {
        console.log('setup selling level limit...')
        tx = await dbProxyAttached.connect(users.operator).setSellingLevelLimit(env.SELLING_LEVEL_LIMIT)
        await tx.wait()
    }
    console.log(`fetching tradingFee...`)
    if (!(await dbProxyAttached.tradingFee()).eq(env.TRADING_FEE)) {
        console.log('setup trading fee...')
        tx = await dbProxyAttached.connect(users.operator).setTradingFee(env.TRADING_FEE)
        await tx.wait()
    }
    console.log(`fetching rootAddress...`)
    if ((await dbProxyAttached.rootAddress()).toLowerCase() !== env.ROOT.toLowerCase()) {
        console.log('setup root address..')
        tx = await dbProxyAttached.connect(users.operator).setRootAddress(env.ROOT)
        await tx.wait()
    }

    console.log(`fetching directRequirementsNum...`)
    parametersLength = (await dbProxyAttached.directRequirementsNum()).toNumber()
    isMatch = parametersLength == env.DIRECT_REQUIREMENTS.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            console.log(`fetching directRequirements ${index}...`)
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

    console.log(`fetching performanceRequirementsNum...`)
    parametersLength = (await dbProxyAttached.performanceRequirementsNum()).toNumber()
    isMatch = parametersLength == env.PERFORMANCE_REQUIREMENTS.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            console.log(`fetching performanceRequirements ${index}...`)
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

    console.log(`fetching socialRewardRatesNum...`)
    parametersLength = (await dbProxyAttached.socialRewardRatesNum()).toNumber()
    isMatch = parametersLength == env.SOCIAL_REWARD.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            console.log(`fetching socialRewardRates ${index}...`)
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

    console.log(`fetching contributionRewardThreshold...`)
    if (!(await dbProxyAttached.contributionRewardThreshold()).eq(env.CONTRIBUTION_THRESHOLD)) {
        console.log('setup contribution reward threshold...')
        tx = await dbProxyAttached.connect(users.operator).setContributionRewardThreshold(env.CONTRIBUTION_THRESHOLD)
        await tx.wait()
    }

    console.log(`fetching contributionRewardAmountsNum...`)
    parametersLength = (await dbProxyAttached.contributionRewardAmountsNum()).toNumber()
    isMatch = parametersLength == env.CONTRIBUTION_REWARD.length
    if (isMatch) {
        for (let index = 0; index < parametersLength; index++) {
            console.log(`fetching contributionRewardAmounts ${index}...`)
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
        console.log(`fetching communityRewardRatesNumByLevel ${indexOuter}...`)
        parametersLength = (await dbProxyAttached.communityRewardRatesNumByLevel(indexOuter)).toNumber()
        isMatch = parametersLength == env.COMMUNITY_REWARD[indexOuter].length
        if (isMatch) {
            for (let indexInner = 0; indexInner < parametersLength; indexInner++) {
                console.log(`fetching communityRewardRates ${indexInner}...`)
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

    console.log(`fetching achievementRewardLevelThreshold...`)
    if (!(await dbProxyAttached.achievementRewardLevelThreshold()).eq(env.ACHIEVEMENT_LEVEL_THRESHOLD)) {
        console.log('setup achievement reward level threshold...')
        tx = await dbProxyAttached.connect(users.operator).setAchievementRewardLevelThreshold(env.ACHIEVEMENT_LEVEL_THRESHOLD)
        await tx.wait()
    }

    console.log(`fetching achievementRewardDurationThreshold...`)
    if (!(await dbProxyAttached.achievementRewardDurationThreshold()).eq(env.ACHIEVEMENT_DURATION)) {
        console.log('setup achievement reward duration threshold...')
        tx = await dbProxyAttached.connect(users.operator).setAchievementRewardDurationThreshold(env.ACHIEVEMENT_DURATION)
        await tx.wait()
    }

    console.log(`fetching achievementRewardAmountsNum...`)
    parametersLength = (await dbProxyAttached.achievementRewardAmountsNum()).toNumber()
    isMatch = parametersLength == env.ACHIEVEMENT_REWARD.length
    if (isMatch) {
        for (let index = 0; index > parametersLength; index++) {
            console.log(`fetching achievementRewardAmountsNum ${index}...`)
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

    console.log(`fetching packageLength...`)
    parametersLength = (await dbProxyAttached.packageLength()).toNumber()
    isMatch = parametersLength == env.AP_PACKAGE.length
    if (isMatch) {
        for (let indexOuter = 0; indexOuter < env.AP_PACKAGE.length; indexOuter++) {
            console.log(`fetching packageLength ${indexOuter}...`)
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

    console.log(`fetching duration...`)
    if (!(await dbProxyAttached.duration()).eq(env.DURATION)) {
        console.log('setup duration...')
        tx = await dbProxyAttached.connect(users.operator).setDuration(env.DURATION)
        await tx.wait()
    }

    console.log(`fetching the performanceThreshold...`)
    if (!(await dbProxyAttached.performanceThreshold()).eq(env.PERFORMANCE_THRESHOLD)) {
        console.log('setup the performanceThreshold...')
        tx = await dbProxyAttached.connect(users.operator).setPerformanceThreshold(env.PERFORMANCE_THRESHOLD)
        await tx.wait()
    }
    
    console.log(`fetching the earlyBirdInitCA...`)
    if (!(await dbProxyAttached.earlyBirdInitCA()).eq(env.EARLY_BIRD_INIT_CA)) {
        console.log('setup the earlyBirdInitCA...')
        tx = await dbProxyAttached.connect(users.operator).setEarlyBirdInitCA(env.EARLY_BIRD_INIT_CA)
        await tx.wait()
    }

    console.log(`fetching the earlyBirdMintIdRange...`)
    const idRange = await dbProxyAttached.earlyBirdMintIdRange()
    if (!idRange[0].eq(env.EARLY_BIRD_MINT_START_ID) || !idRange[1].eq(env.EARLY_BIRD_MINT_END_ID)) {
        console.log('setup the earlyBirdMintIdRange...')
        tx = await dbProxyAttached.connect(users.operator).setEarlyBirdMintIdRange(env.EARLY_BIRD_MINT_START_ID, env.EARLY_BIRD_MINT_END_ID)
        await tx.wait()
    }

    console.log(`fetching the mint price...`)
    const mintPrice = await dbProxyAttached.earlyBirdMintPrice()
    if (mintPrice[0].toLocaleLowerCase() !== env.EARLY_BIRD_MINT_PAYMENT.toLocaleLowerCase() || !mintPrice[1].eq(env.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)) {
        console.log('setup the earlyBirdMintPrice...')
        tx = await dbProxyAttached.connect(users.operator).setEarlyBirdMintPrice(env.EARLY_BIRD_MINT_PAYMENT, env.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await tx.wait()
    }

    console.log(`fetching the switch...`)
    const earlyBirdEnable = await dbProxyAttached.earlyBirdMintEnable()
    const commonEnable = await dbProxyAttached.commonMintEnable()
    if (earlyBirdEnable !== env.EARLY_BIRD_MINT_ENABLE || commonEnable !== env.COMMON_MINT_ENABLE) {
        console.log('setup the switch...')
        tx = await dbProxyAttached.connect(users.operator).setSwitch(env.EARLY_BIRD_MINT_ENABLE, env.COMMON_MINT_ENABLE)
        await tx.wait()
    }
}

export default func
func.tags = ['setup_env']
func.dependencies = ['test_net']
