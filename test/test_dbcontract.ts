import {
    CONTRACT_FIX,
    CONTRACT_STATE,
    createRandomSignerAndSendETH,
    ENV_FIX,
    get_contract_state,
    get_env,
    get_user,
    set_up_fixture,
    USER_FIX,
} from "./start_up";
import {expect} from "chai";
import {ethers} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {Attribute, Level} from "../constants/constants";

describe("db contract", function () {

    let envs: ENV_FIX
    let state: CONTRACT_STATE
    let users: USER_FIX
    let contracts: CONTRACT_FIX

    async function createFixture() {
        console.log('before createFixture...');
        const envs = get_env()
        const state = get_contract_state()
        const users = await get_user()
        const contracts = await set_up_fixture("test_net")
        return { envs, state, users, contracts };
    }

    beforeEach(async () => {
        ({ envs, state, users, contracts } = await loadFixture(createFixture));
        await contracts.dbContract.connect(users.owner1).setOperator(users.operator.address)
    });

    it("should initializer twice?", async function () {
        await expect(
            contracts.dbContract.__DBContract_init([])
        ).to.be.revertedWith('Initializable: contract is already initialized')
    })

    it('should set the operator?', async function () {
        await expect(
            contracts.dbContract.setOperator(ethers.constants.AddressZero)
        ).to.be.revertedWith('Ownable: caller is not the owner')

        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.dbContract.connect(users.owner1).setOperator(randomUser.address)
        expect(await contracts.dbContract.operator()).to.equal(randomUser.address)
    });

    it('should set the addresses', async function () {
        await expect(
            contracts.dbContract.setAddresses([])
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setAddresses([])
        ).to.be.revertedWith('DBContract: addresses length mismatch.')

        const addresses = []
        for (let index = 0; index < 9; index++)
            addresses.push(ethers.constants.AddressZero)
        await contracts.dbContract.connect(users.operator).setAddresses(addresses)
        expect(await contracts.dbContract.LYNK_TOKEN()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.AP_TOKEN()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.STAKING()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.LYNKNFT()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.STAKING_LYNKNFT()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.LISTED_LYNKNFT()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.MARKET()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.USER_INFO()).to.equal(ethers.constants.AddressZero)
        expect(await contracts.dbContract.TEAM_ADDR()).to.equal(ethers.constants.AddressZero)
    });

    it('should set mint price?', async function () {
        await expect(
            contracts.dbContract.setMintPrices([])
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setMintPrices([])
        ).to.be.revertedWith('DBContract: length mismatch.')

        await contracts.dbContract.connect(users.operator).setMintPrices([0,1,2])
        expect(await contracts.dbContract.mintPrices(0)).to.equal(0)
        expect(await contracts.dbContract.mintPrices(1)).to.equal(1)
        expect(await contracts.dbContract.mintPrices(2)).to.equal(2)
    });

    it('should set the max mint per day per address?', async function () {
        await expect(
            contracts.dbContract.setMaxMintPerDayPerAddress(0)
        ).to.be.revertedWith('DBContract: caller is not the operator')

        await contracts.dbContract.connect(users.operator).setMaxMintPerDayPerAddress(0)
        expect(await contracts.dbContract.maxMintPerDayPerAddress()).to.equal(0)
    });

    it('should set the base uri?', async function () {
        await expect(
            contracts.dbContract.setBaseTokenURI('https://...')
        ).to.be.revertedWith('DBContract: caller is not the operator')

        await contracts.dbContract.connect(users.operator).setBaseTokenURI('https://...')
        expect(await contracts.dbContract.baseTokenURI()).to.equal('https://...')
    });

    it('should set the attribute level threshold?', async function () {
        await expect(
            contracts.dbContract.setAttributeLevelThreshold(Attribute.charisma.valueOf(), [])
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setAttributeLevelThreshold(Attribute.dexterity.valueOf(), [])
        ).to.be.revertedWith('DBContract: length mismatch.')
        await expect(
            contracts.dbContract.connect(users.operator).setAttributeLevelThreshold(Attribute.charisma.valueOf(), [2,1])
        ).to.be.revertedWith('DBContract: invalid thresholds.')

        await contracts.dbContract.connect(users.operator).setAttributeLevelThreshold(Attribute.charisma.valueOf(), [1,2])
        expect(await contracts.dbContract.attributeLevelThresholdNumByIndex(Attribute.charisma.valueOf())).to.equal(2)
        expect(await contracts.dbContract.attributeLevelThresholdNumByIndex(Attribute.charisma.valueOf() + 1)).to.equal(0)
        expect(await contracts.dbContract.attributeLevelThreshold(Attribute.charisma.valueOf(), 0)).to.equal(1)
        expect(await contracts.dbContract.attributeLevelThreshold(Attribute.charisma.valueOf(), 1)).to.equal(2)

        await contracts.dbContract.connect(users.operator).setAttributeLevelThreshold(Attribute.charisma.valueOf(), [3,4,5])
        expect(await contracts.dbContract.attributeLevelThresholdNumByIndex(Attribute.charisma.valueOf())).to.equal(3)
        expect(await contracts.dbContract.attributeLevelThresholdNumByIndex(Attribute.charisma.valueOf() + 1)).to.equal(0)
        expect(await contracts.dbContract.attributeLevelThreshold(Attribute.charisma.valueOf(), 0)).to.equal(3)
        expect(await contracts.dbContract.attributeLevelThreshold(Attribute.charisma.valueOf(), 1)).to.equal(4)
        expect(await contracts.dbContract.attributeLevelThreshold(Attribute.charisma.valueOf(), 2)).to.equal(5)
    });

    it('should set and remove the accept token?', async function () {
        await expect(
            contracts.dbContract.setAcceptToken(ethers.constants.AddressZero)
        ).to.be.revertedWith('DBContract: caller is not the operator')

        await contracts.dbContract.connect(users.operator).setAcceptToken(ethers.constants.AddressZero)
        expect(await contracts.dbContract.acceptTokenLength()).to.equal(1)
        expect(await contracts.dbContract.isAcceptToken(ethers.constants.AddressZero)).to.equal(true)
        // mutil send
        await contracts.dbContract.connect(users.operator).setAcceptToken(ethers.constants.AddressZero)
        expect(await contracts.dbContract.acceptTokenLength()).to.equal(1)
        expect(await contracts.dbContract.isAcceptToken(ethers.constants.AddressZero)).to.equal(true)

        await contracts.dbContract.connect(users.operator).setAcceptToken(contracts.USDT.address)
        await expect(
            contracts.dbContract.removeAcceptToken(ethers.constants.AddressZero)
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await contracts.dbContract.connect(users.operator).removeAcceptToken(0)
        expect(await contracts.dbContract.acceptTokenLength()).to.equal(1)
        await contracts.dbContract.connect(users.operator).removeAcceptToken(0)
        expect(await contracts.dbContract.acceptTokenLength()).to.equal(0)
        expect(await contracts.dbContract.isAcceptToken(ethers.constants.AddressZero)).to.equal(false)
    });

    it('should set the selling limit?', async function () {
        await expect(
            contracts.dbContract.setSellingLevelLimit(2)
        ).to.be.revertedWith('DBContract: caller is not the operator')

        await contracts.dbContract.connect(users.operator).setSellingLevelLimit(2)
        expect(await contracts.dbContract.sellingLevelLimit()).to.equal(2)
    });

    it('should set the trading fee?', async function () {
        await expect(
            contracts.dbContract.setTradingFee(ethers.constants.WeiPerEther)
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setTradingFee(ethers.constants.WeiPerEther.add(1))
        ).to.be.revertedWith('DBContract: too large.')

        await contracts.dbContract.connect(users.operator).setTradingFee(ethers.constants.WeiPerEther)
        expect(await contracts.dbContract.tradingFee()).to.equal(ethers.constants.WeiPerEther)
    });

    it('should set the root address', async function () {
        await expect(
            contracts.dbContract.setRootAddress(ethers.constants.AddressZero)
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setRootAddress(ethers.constants.AddressZero)
        ).to.be.revertedWith('DBContract: root cannot be zero address.')

        await contracts.dbContract.connect(users.operator).setRootAddress(envs.ROOT)
        expect(await contracts.dbContract.rootAddress()).to.equal(envs.ROOT)
    });

    it('should set the direct requirements?', async function () {
        await expect(
            contracts.dbContract.setDirectRequirements([])
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setDirectRequirements([])
        ).to.be.revertedWith('DBContract: length mismatch.')

        await contracts.dbContract.connect(users.operator).setDirectRequirements([1,2,3,4,5])
        expect(await contracts.dbContract.directRequirements(0)).to.equal(1)
        expect(await contracts.dbContract.directRequirements(1)).to.equal(2)
        expect(await contracts.dbContract.directRequirements(2)).to.equal(3)
        expect(await contracts.dbContract.directRequirements(3)).to.equal(4)
        expect(await contracts.dbContract.directRequirements(4)).to.equal(5)
    });

    it('should set the performance requirements?', async function () {
        await expect(
            contracts.dbContract.setPerformanceRequirements([])
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setPerformanceRequirements([])
        ).to.be.revertedWith('DBContract: length mismatch.')

        await contracts.dbContract.connect(users.operator).setPerformanceRequirements([1,2,3,4,5])
        expect(await contracts.dbContract.performanceRequirements(0)).to.equal(1)
        expect(await contracts.dbContract.performanceRequirements(1)).to.equal(2)
        expect(await contracts.dbContract.performanceRequirements(2)).to.equal(3)
        expect(await contracts.dbContract.performanceRequirements(3)).to.equal(4)
        expect(await contracts.dbContract.performanceRequirements(4)).to.equal(5)
    });

    it('should set the social reward rates?', async function () {
        await expect(
            contracts.dbContract.setSocialRewardRates([])
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setSocialRewardRates([])
        ).to.be.revertedWith('DBContract: length mismatch.')
        await expect(
            contracts.dbContract.connect(users.operator).setSocialRewardRates([1,2,3,4,5,ethers.constants.WeiPerEther.add(1)])
        ).to.be.revertedWith('DBContract: too large.')

        await contracts.dbContract.connect(users.operator).setSocialRewardRates([1,2,3,4,5,ethers.constants.WeiPerEther])
        expect(await contracts.dbContract.socialRewardRates(0)).to.equal(1)
        expect(await contracts.dbContract.socialRewardRates(1)).to.equal(2)
        expect(await contracts.dbContract.socialRewardRates(2)).to.equal(3)
        expect(await contracts.dbContract.socialRewardRates(3)).to.equal(4)
        expect(await contracts.dbContract.socialRewardRates(4)).to.equal(5)
        expect(await contracts.dbContract.socialRewardRates(5)).to.equal(ethers.constants.WeiPerEther)
    });

    it('should set the contribution reward threshold?', async function () {
        await expect(
            contracts.dbContract.setContributionRewardThreshold(envs.CONTRIBUTION_THRESHOLD)
        ).to.be.revertedWith('DBContract: caller is not the operator')

        await contracts.dbContract.connect(users.operator).setContributionRewardThreshold(envs.CONTRIBUTION_THRESHOLD)
        expect(await contracts.dbContract.contributionRewardThreshold()).to.equal(envs.CONTRIBUTION_THRESHOLD)
    });

    it('should set the contribution reward amounts?', async function () {
        await expect(
            contracts.dbContract.setContributionRewardAmounts(envs.CONTRIBUTION_REWARD)
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setContributionRewardAmounts([])
        ).to.be.revertedWith('DBContract: length mismatch.')
        await contracts.dbContract.connect(users.operator).setContributionRewardAmounts(envs.CONTRIBUTION_REWARD)
        for (let index = 0; index < envs.CONTRIBUTION_REWARD.length; index++)
            expect(await contracts.dbContract.contributionRewardAmounts(index)).to.equal(envs.CONTRIBUTION_REWARD[index])
    });

    it('should set the community reward rates?', async function () {
        await expect(
            contracts.dbContract.setCommunityRewardRates(Level.mythic, envs.COMMUNITY_REWARD[Level.mythic.valueOf()])
        ).to.be.revertedWith('DBContract: caller is not the operator')

        expect(await contracts.dbContract.maxInvitationLevel()).to.equal(0)
        await contracts.dbContract.connect(users.operator).setCommunityRewardRates(Level.mythic, envs.COMMUNITY_REWARD[Level.mythic.valueOf()])
        expect(await contracts.dbContract.maxInvitationLevel()).to.equal(envs.COMMUNITY_REWARD[Level.mythic.valueOf()].length)
        expect(await contracts.dbContract.communityRewardRate(Level.mythic, envs.COMMUNITY_REWARD[Level.mythic.valueOf()].length + 1)).to.equal(0)

        await contracts.dbContract.connect(users.operator).setCommunityRewardRates(Level.elite, envs.COMMUNITY_REWARD[Level.elite.valueOf()])
        expect(await contracts.dbContract.maxInvitationLevel()).to.equal(envs.COMMUNITY_REWARD[Level.mythic.valueOf()].length)
    });

    it('should set the achievement reward duration threshold?', async function () {
        await expect(
            contracts.dbContract.setAchievementRewardDurationThreshold(envs.ACHIEVEMENT_DURATION)
        ).to.be.revertedWith('DBContract: caller is not the operator')

        await contracts.dbContract.connect(users.operator).setAchievementRewardDurationThreshold(envs.ACHIEVEMENT_DURATION)
        expect(await contracts.dbContract.achievementRewardDurationThreshold()).to.equal(envs.ACHIEVEMENT_DURATION)
    });

    it('should set the achievement reward level threshold?', async function () {
        await expect(
            contracts.dbContract.setAchievementRewardLevelThreshold(envs.ACHIEVEMENT_LEVEL_THRESHOLD)
        ).to.be.revertedWith('DBContract: caller is not the operator')

        await contracts.dbContract.connect(users.operator).setAchievementRewardLevelThreshold(envs.ACHIEVEMENT_LEVEL_THRESHOLD)
        expect(await contracts.dbContract.achievementRewardLevelThreshold()).to.equal(envs.ACHIEVEMENT_LEVEL_THRESHOLD)
    });

    it('should set the achievement reward amounts?', async function () {
        await expect(
            contracts.dbContract.setAchievementRewardAmounts(envs.ACHIEVEMENT_REWARD)
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setAchievementRewardAmounts([])
        ).to.be.revertedWith('DBContract: length mismatch.')

        await contracts.dbContract.connect(users.operator).setAchievementRewardAmounts(envs.ACHIEVEMENT_REWARD)
        for (let index = 0; index < envs.ACHIEVEMENT_REWARD.length; index++) {
            expect(await contracts.dbContract.achievementRewardAmounts(index)).to.equal(envs.ACHIEVEMENT_REWARD[index])
        }
    });

    it('should set the selling package?', async function () {
        await expect(
            contracts.dbContract.setSellingPackage(envs.AP_PACKAGE)
        ).to.be.revertedWith('DBContract: caller is not the operator')
        await expect(
            contracts.dbContract.connect(users.operator).setSellingPackage([[]])
        ).to.be.revertedWith('DBContract: length mismatch.')
        await contracts.dbContract.connect(users.operator).setSellingPackage(envs.AP_PACKAGE)
    });


})