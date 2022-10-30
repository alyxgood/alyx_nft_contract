import {
    CONTRACT_FIX,
    CONTRACT_STATE,
    createRandomSignerAndSendETH,
    ENV_FIX,
    get_contract_state,
    get_env,
    get_user, mintLYNKNFTAndCheck, nft_level_up,
    set_up_fixture,
    USER_FIX,
} from "./start_up";
import {expect} from "chai";
import {ethers} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {BigNumber} from "ethers";
import {Attribute, Level} from "../constants/constants";
import {increase} from "./helpers/time";

describe("user", function () {

    let envs: ENV_FIX
    let state: CONTRACT_STATE
    let users: USER_FIX
    let contracts: CONTRACT_FIX

    async function createFixture() {
        console.log('before createFixture...');
        const envs = get_env()
        const state = get_contract_state()
        const users = await get_user()
        const contracts = await set_up_fixture("setup_env")
        return { envs, state, users, contracts };
    }

    beforeEach(async () => {
        ({ envs, state, users, contracts } = await loadFixture(createFixture));
    });

    it("should initializer twice?", async function () {
        await expect(
            contracts.user.__User_init()
        ).to.be.revertedWith('Initializable: contract is already initialized')
    })

    it('should register twice?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        const tx = await contracts.dbContract.connect(users.operator).setRootAddress(randomUser.address)
        await tx.wait()
        await expect(
            contracts.user.connect(randomUser).register(envs.ROOT)
        ).to.be.revertedWith('User: already register.')

        await contracts.dbContract.connect(users.operator).setRootAddress(envs.ROOT)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        await expect(
            contracts.user.connect(randomUser).register(envs.ROOT)
        ).to.be.revertedWith('User: already register.')
    });

    it('should register by using a invalid ref address?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.user.connect(randomUser1).register(randomUser2.address)
        ).to.be.revertedWith('User: the ref not a valid ref address.')
    });

    it('should hookByUpgrade by a unLYNKNFTContract?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.user.connect(randomUser).hookByUpgrade(randomUser.address, 1)
        ).to.be.revertedWith('baseContract: caller not the LYNK NFT contract.')
    });

    it('should send the contribution reward?', async function () {
        const randomUserRef = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUserRef).register(envs.ROOT)
        await contracts.user.connect(randomUser).register(randomUserRef.address)

        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)
        const decimalUSDT = await contracts.USDT.decimals()
        const spentAmount = BigNumber.from(envs.CONTRIBUTION_THRESHOLD).mul(3).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, spentAmount)
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, spentAmount)

        let balanceOfAPTokenBefore = await contracts.apToken.balanceOf(randomUserRef.address)
        await contracts.LYNKNFT.connect(randomUser).upgrade(Attribute.charisma.valueOf(), tokenId, spentAmount.div(3).div(BigNumber.from(10).pow(decimalUSDT)), contracts.USDT.address)
        const balanceOfAPTokenAfter = await contracts.apToken.balanceOf(randomUserRef.address)
        expect(balanceOfAPTokenAfter).to.be.gt(balanceOfAPTokenBefore)

        balanceOfAPTokenBefore = balanceOfAPTokenAfter
        await contracts.dbContract.connect(users.operator).setContributionRewardAmounts([0,0,0,0,0,0])
        await contracts.LYNKNFT.connect(randomUser).upgrade(Attribute.charisma.valueOf(), tokenId, spentAmount.div(3).div(BigNumber.from(10).pow(decimalUSDT)), contracts.USDT.address)
        expect(balanceOfAPTokenAfter).to.be.equal(balanceOfAPTokenBefore)

        await contracts.dbContract.connect(users.operator).setContributionRewardAmounts(envs.CONTRIBUTION_REWARD)
        await contracts.dbContract.connect(users.operator).setContributionRewardThreshold(0)
        await contracts.LYNKNFT.connect(randomUser).upgrade(Attribute.charisma.valueOf(), tokenId, spentAmount.div(3).div(BigNumber.from(10).pow(decimalUSDT)), contracts.USDT.address)
        expect(balanceOfAPTokenAfter).to.be.equal(balanceOfAPTokenBefore)
    });

    it('should hookByStake call by a unStakingContract?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.user.connect(randomUser).hookByStake(1)
        ).to.be.revertedWith('baseContract: caller not the Staking contract.')
    });

    it('should hookByUnStake call by a unStakingContract?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.user.connect(randomUser).hookByUnStake(1)
        ).to.be.revertedWith('baseContract: caller not the Staking contract.')
    });

    it('should hookByClaimReward call by a unStakingContract', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.user.connect(randomUser).hookByClaimReward(randomUser.address, 1)
        ).to.be.revertedWith('baseContract: caller not the Staking contract.')
    });

    it('should claim the achievement reward?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        await contracts.user.connect(randomUser2).register(envs.ROOT)

        await expect(
            contracts.user.connect(randomUser1).claimAchievementReward([0])
        ).to.be.revertedWith('ERC721: invalid token ID')
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await nft_level_up(tokenId, randomUser1, (await contracts.dbContract.achievementRewardLevelThreshold()).toNumber(), contracts, envs)
        await expect(
            contracts.user.connect(randomUser1).claimAchievementReward([tokenId])
        ).to.be.revertedWith('User: cannot claim 0.')

        await contracts.LYNKNFT.connect(randomUser1).approve(contracts.staking.address, tokenId)
        await contracts.staking.connect(randomUser1).stake(tokenId)
        await expect(
            contracts.user.connect(randomUser2).claimAchievementReward([tokenId])
        ).to.be.revertedWith('User: not the owner.')

        await increase(await contracts.dbContract.achievementRewardDurationThreshold())
        const apTokenBalanceOfBefore = await contracts.apToken.balanceOf(randomUser1.address)
        await contracts.user.connect(randomUser1).claimAchievementReward([tokenId])
        expect(await contracts.apToken.balanceOf(randomUser1.address)).to.gt(apTokenBalanceOfBefore)
    });

    it('should audit level?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.user.connect(randomUser).auditLevel(randomUser.address)
        ).to.to.revertedWith('User: not a valid user.')
        await contracts.user.connect(randomUser).register(envs.ROOT)
        await contracts.user.connect(randomUser).auditLevel(envs.ROOT)
        await contracts.user.connect(randomUser).auditLevel(randomUser.address)
    });

    it('should query ref counter of?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)
        expect(await contracts.user.refCounterOf(randomUser1.address, Level.elite.valueOf())).to.equal(0)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        expect(await contracts.user.refCounterOf(randomUser1.address, Level.elite.valueOf())).to.equal(0)
        await contracts.user.connect(randomUser2).register(randomUser1.address)
        expect(await contracts.user.refCounterOf(randomUser1.address, Level.elite.valueOf())).to.equal(1)
    });
})