import {
    CONTRACT_FIX,
    CONTRACT_STATE,
    createRandomSignerAndSendETH,
    ENV_FIX,
    get_contract_state,
    get_env,
    get_user,
    mintLYNKNFTAndCheck,
    NFT_LEVEL_FIX,
    set_up_fixture,
    transferLYNKNFTAndCheck,
    USER_FIX,
    USER_LEVEL_FIX,
    user_level_up,
    set_up_level,
    set_up_nft_level
} from "./start_up";
import {BigNumber} from "ethers";
import {assert, expect} from "chai";
import {ethers} from "hardhat";
import {Attribute, Level} from "../constants/constants";
import {increase, now} from "./helpers/time";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {address} from "hardhat/internal/core/config/config-validation";



describe("main_process", function () {

    let state: CONTRACT_STATE
    let envs: ENV_FIX
    let users: USER_FIX
    let contracts: CONTRACT_FIX
    let userLevels: USER_LEVEL_FIX
    let nftLevels: NFT_LEVEL_FIX

    async function createFixture() {

        console.log('before createFixture...');

        let  state = get_contract_state()
        let envs = get_env()
        let users = await get_user()
        let  contracts = await set_up_fixture("test_net")
        // 1. create fixture
        let userLevels = await set_up_level(users.team_addr.address, contracts, envs, users, state)
        let nftLevels = await set_up_nft_level(users.team_addr.address, users.user1, contracts, envs, state)
        // await contracts.user.connect(users.user1).register(envs.ROOT)
        // nftLevels = await set_up_nft_level(users.team_addr.address, users.user1, contracts, envs, state)

        // Fixtures can return anything you consider useful for your tests
        return { state, envs, users, contracts, userLevels ,nftLevels };
    }

    beforeEach(async () => {
       ({state, envs, users, contracts, userLevels ,nftLevels } = await loadFixture(createFixture));
    });

    it("user1 buy APToken", async function () {
        let tx;

        // user1 buy APToken
        let user1APTBalance = await contracts.apToken.balanceOf(users.user1.address)
        for (let index = 0; index < envs.AP_PACKAGE.length; index++) {
            tx = await contracts.apToken
                .connect(users.user1)["mint(uint256)"](
                index,
                {value: BigNumber.from(envs.AP_PACKAGE[index][1])}
            )
            expect(tx.value).to.equal(envs.AP_PACKAGE[index][1])
            await expect(tx)
                .to.emit(contracts.apToken, 'Transfer')
                .withArgs(ethers.constants.AddressZero, users.user1.address, envs.AP_PACKAGE[index][2])

            user1APTBalance = user1APTBalance.add(envs.AP_PACKAGE[index][2])
            expect(await contracts.apToken.balanceOf(users.user1.address)).to.equal(user1APTBalance)
        }
    })



    it("user2 upgrade CA", async function () {
        let tx;

        // user2 upgrade CA
        const user2Ref = await createRandomSignerAndSendETH(users.deployer1)
        await user_level_up(users.team_addr.address, users.deployer1, user2Ref, Level.elite, contracts, envs, state, undefined)
        await contracts.user.connect(users.user2).register(user2Ref.address)
        const user2TokenId = await mintLYNKNFTAndCheck(users.team_addr.address, users.user2, contracts, envs, state)

        const decimalUSDT = await contracts.USDT.decimals()
        const mintAmount = BigNumber.from(100).mul(Level.divine.valueOf() + 1).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(users.user2).mint(users.user2.address, mintAmount)
        await contracts.USDT.connect(users.user2).approve(contracts.LYNKNFT.address, mintAmount)
        // for elite -> divine (user2Ref)
        for (let index = 0; index < Level.divine.valueOf() + 1; index++) {
            await user_level_up(users.team_addr.address, users.deployer1, user2Ref, (index as Level), contracts, envs, state, undefined)
            tx = await contracts.LYNKNFT.connect(users.user2).upgrade(Attribute.charisma.valueOf(), user2TokenId, 100, contracts.USDT.address)
            const spentAmount = BigNumber.from(envs.CONTRIBUTION_THRESHOLD).mul(BigNumber.from(10).pow(decimalUSDT))

            await expect(tx)
                .to.emit(contracts.USDT, 'Transfer')
                .withArgs(users.user2.address, users.team_addr.address, spentAmount)
            // Social Reward
            await expect(tx)
                .to.emit(contracts.LYNKToken, 'Transfer')
                .withArgs(ethers.constants.AddressZero, user2Ref.address, BigNumber.from(envs.SOCIAL_REWARD[index]).mul(spentAmount).div(BigNumber.from(10).pow(18)))
            // Contribution Reward
            await expect(tx)
                .to.emit(contracts.apToken, 'Transfer')
                .withArgs(ethers.constants.AddressZero, user2Ref.address, envs.CONTRIBUTION_REWARD[index])
        }
    })


    it("user3 mint LYNKNFT && transfer LYNKNFT to user 4", async function () {
        // user3 mint LYNKNFT
        await contracts.user.connect(users.user3).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, users.user3, contracts, envs, state)

        await transferLYNKNFTAndCheck(users.user3, users.user4.address, tokenId, contracts)
    })

    it("Marketplace", async function () {
        // Marketplace
        let tx;

        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            await transferLYNKNFTAndCheck(users.user1, users.user2.address, nftLevels.token_id_by_level[index], contracts)
        }
        await user_level_up(users.team_addr.address, users.deployer1, users.user2, Level.elite, contracts, envs, state, undefined)

        let listNFTNum = await contracts.market.onSellNum()
        const levelLimit = BigNumber.from(envs.SELLING_LEVEL_LIMIT).toNumber()
        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            const tokenId = nftLevels.token_id_by_level[index];
            await contracts.LYNKNFT.connect(users.user2).approve(contracts.market.address, tokenId)

            if (index < levelLimit) {
                await expect(
                    contracts.market.connect(users.user2).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)
                ).revertedWith('Market: Cannot trade yet.')

                continue
            }

            tx = await contracts.market.connect(users.user2).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(users.user2.address, contracts.market.address, tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.market.address, contracts.lLYNKNFT.address, tokenId)
            await expect(tx)
                .to.emit(contracts.lLYNKNFT, 'Transfer')
                .withArgs(ethers.constants.AddressZero, users.user2.address, tokenId)

            const listInfo = await contracts.market.listNFTs(listNFTNum)
            expect(listInfo.seller).to.equal(users.user2.address)
            expect(listInfo.tokenId).to.equal(tokenId)
            expect(listInfo.acceptToken).to.equal(ethers.constants.AddressZero)
            expect(listInfo.priceInAcceptToken).to.equal(ethers.constants.WeiPerEther)

            expect(await contracts.market.listIndexByTokenId(tokenId)).to.equal(listNFTNum)

            listNFTNum = listNFTNum.add(1)
            expect(await contracts.market.onSellNum()).to.equal(listNFTNum)
        }

        // cancel a part of order
        {
            const lastNFTInfo = await contracts.market.listNFTs(listNFTNum.sub(1))
            const tokenId = nftLevels.token_id_by_level[levelLimit];
            const listIndex = await contracts.market.listIndexByTokenId(tokenId)
            tx = await contracts.market.connect(users.user2).cancelList(listIndex, tokenId)
            await expect(tx)
                .to.emit(contracts.lLYNKNFT, 'Transfer')
                .withArgs(users.user2.address, ethers.constants.AddressZero, tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.lLYNKNFT.address, contracts.market.address, tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.market.address, users.user2.address, tokenId)

            const nftInfo = await contracts.market.listNFTs(listIndex)
            expect(nftInfo.seller).to.equal(lastNFTInfo.seller)
            expect(nftInfo.tokenId).to.equal(lastNFTInfo.tokenId)
            expect(nftInfo.acceptToken).to.equal(lastNFTInfo.acceptToken)
            expect(nftInfo.priceInAcceptToken).to.equal(lastNFTInfo.priceInAcceptToken)

            listNFTNum = listNFTNum.sub(1)
            expect(await contracts.market.onSellNum()).to.equal(listNFTNum)
        }

        // user5 register & buy
        await user_level_up(users.team_addr.address, users.deployer1, users.user5, Level.elite, contracts, envs, state, undefined)
        for (let index = listNFTNum.toNumber() - 1; index >= 0; index--) {
            const balanceOfSellerBefore = await users.user2.getBalance()
            const balanceOfBuyerBefore = await users.user5.getBalance()
            const balanceOfTeamBefore = await users.team_addr.getBalance()

            const nftInfo = await contracts.market.listNFTs(index)
            tx = await contracts.market.connect(users.user5).takeNFT(index, nftInfo.tokenId, {value: nftInfo.priceInAcceptToken})
            await expect(tx)
                .to.emit(contracts.lLYNKNFT, 'Transfer')
                .withArgs(nftInfo.seller, ethers.constants.AddressZero, nftInfo.tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.lLYNKNFT.address, contracts.market.address, nftInfo.tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.market.address, users.user5.address, nftInfo.tokenId)
            tx = await tx.wait()

            const fee = nftInfo.priceInAcceptToken.mul(BigNumber.from(envs.TRADING_FEE)).div(ethers.constants.WeiPerEther)
            // Gas fee
            expect(
                balanceOfBuyerBefore.sub(nftInfo.priceInAcceptToken).sub(await users.user5.getBalance())
            ).to.equal(tx.gasUsed.mul(tx.effectiveGasPrice))
            expect(await users.team_addr.getBalance()).to.equal(balanceOfTeamBefore.add(fee))
            expect(await users.user2.getBalance()).to.equal(balanceOfSellerBefore.add(nftInfo.priceInAcceptToken.sub(fee)))
        }
    })


    it("stake NFT", async function () {
        let tx;

        const user2Ref = await createRandomSignerAndSendETH(users.deployer1)
        await user_level_up(users.team_addr.address, users.deployer1, user2Ref, Level.elite, contracts, envs, state, undefined)
        await contracts.user.connect(users.user2).register(user2Ref.address)

        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            await transferLYNKNFTAndCheck(users.user1, users.user2.address, nftLevels.token_id_by_level[index], contracts)
        }

        // stake NFT
        let charisma = BigNumber.from(0)
        let dexterity = BigNumber.from(0)
        expect(await contracts.staking.claimableOf(users.user2.address)).to.equal(0);
        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            const nftInfo = await contracts.LYNKNFT.nftInfoOf(nftLevels.token_id_by_level[index])
            assert.ok(nftInfo.length == Attribute.intellect.valueOf() + 1)
            charisma = charisma.add(nftInfo[Attribute.charisma.valueOf()])
            dexterity = dexterity.add(nftInfo[Attribute.dexterity.valueOf()])

            expect(await contracts.LYNKNFT.ownerOf(nftLevels.token_id_by_level[index])).to.equal(users.user2.address)
        }

        const balanceOfUser2Before = await contracts.LYNKToken.balanceOf(users.user2.address)
        const balanceOfUser2RefBefore = await contracts.LYNKToken.balanceOf(user2Ref.address)
        await contracts.LYNKNFT.connect(users.user2).setApprovalForAll(contracts.staking.address, true)
        tx = await contracts.staking.connect(users.user2).stake(nftLevels.token_id_by_level)
        const stakeTimestamp = await now()
        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            const tokenId = nftLevels.token_id_by_level[index];
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(users.user2.address, contracts.staking.address, tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.staking.address, contracts.sLYNKNFT.address, tokenId)
            await expect(tx)
                .to.emit(contracts.sLYNKNFT, 'Transfer')
                .withArgs(ethers.constants.AddressZero, users.user2.address, tokenId)
        }
        await increase(24*60*60)
        tx = await contracts.staking.connect(users.user2).unstake(nftLevels.token_id_by_level)
        const unStakeTimestamp = await now()
        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            const tokenId = nftLevels.token_id_by_level[index];
            await expect(tx)
                .to.emit(contracts.sLYNKNFT, 'Transfer')
                .withArgs(users.user2.address, ethers.constants.AddressZero, tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.sLYNKNFT.address, contracts.staking.address, tokenId)
            await expect(tx)
                .to.emit(contracts.LYNKNFT, 'Transfer')
                .withArgs(contracts.staking.address, users.user2.address, tokenId)
        }
        expect(await contracts.LYNKToken.balanceOf(users.user2.address)).to.equal(balanceOfUser2Before)
        expect(await contracts.LYNKToken.balanceOf(user2Ref.address)).to.equal(balanceOfUser2RefBefore)

        const stakeDuration = unStakeTimestamp.sub(stakeTimestamp)
        assert.ok(stakeDuration.gte(24*60*60))
        const claimable = await contracts.staking.claimableOf(users.user2.address)
        const claimableCalc = rewardRate(charisma, dexterity).mul(stakeDuration)
        expect(claimable).to.equal(claimableCalc)

        // user2 claim reward
        tx = await contracts.staking.connect(users.user2).claimReward()
        await expect(tx)
            .to.emit(contracts.LYNKToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, users.user2.address, claimableCalc)
        await expect(tx)
            .to.emit(contracts.staking, 'Claim')
            .withArgs(users.user2.address, claimableCalc)

        await expect(tx)
            .to.emit(contracts.LYNKToken, 'Transfer')
            .withArgs(
                ethers.constants.AddressZero,
                user2Ref.address,
                BigNumber.from(envs.COMMUNITY_REWARD[Level.elite.valueOf()][0]).mul(claimableCalc).div(ethers.constants.WeiPerEther)
            )
    })

    it('should achievement reward distribute work well?', async function () {
        let tx
        let stakeTimestamp, unStakeTimestamp
        let charisma = BigNumber.from(0)
        let dexterity = BigNumber.from(0)
        const achievementLevelThreshold = BigNumber.from(envs.ACHIEVEMENT_LEVEL_THRESHOLD).toNumber()

        const user2Ref = await createRandomSignerAndSendETH(users.deployer1)
        await user_level_up(users.team_addr.address, users.deployer1, user2Ref, Level.elite, contracts, envs, state, undefined)
        await contracts.user.connect(users.user2).register(user2Ref.address)

        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            const tokenId = nftLevels.token_id_by_level[index]
            const nftInfo = await contracts.LYNKNFT.nftInfoOf(tokenId)
            assert.ok(nftInfo.length == Attribute.intellect.valueOf() + 1)
            charisma = charisma.add(nftInfo[Attribute.charisma.valueOf()])
            dexterity = dexterity.add(nftInfo[Attribute.dexterity.valueOf()])

            await transferLYNKNFTAndCheck(users.user1, users.user2.address, tokenId, contracts)
        }

        // stake & increase 8 days
        await contracts.LYNKNFT.connect(users.user2).setApprovalForAll(contracts.staking.address, true)
        await contracts.staking.connect(users.user2).stake(nftLevels.token_id_by_level)
        stakeTimestamp = await now()
        await increase(8*24*60*60)
        await contracts.staking.connect(users.user2).unstake(nftLevels.token_id_by_level)
        unStakeTimestamp = await now()
        let stakeDurationTotal = unStakeTimestamp.sub(stakeTimestamp)
        expect(stakeDurationTotal.sub(8*24*60*60)).to.lt(15)    // lt 15 second is cool

        // increase 1 day
        await increase(24*60*60)
        await contracts.staking.connect(users.user2).stake(nftLevels.token_id_by_level)
        stakeTimestamp = await now()
        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            const tokenId = nftLevels.token_id_by_level[index]
            const stakeInfo = await contracts.user.stakeNFTs(tokenId)
            expect(stakeInfo.stakedDuration).to.equal(index >= achievementLevelThreshold ? stakeDurationTotal : 0)
            expect(stakeInfo.lastUpdateTime).to.equal(index >= achievementLevelThreshold ? stakeTimestamp : 0)
        }

        // increase 3 days
        await increase(3*24*60*60)
        await contracts.staking.connect(users.user2).unstake(nftLevels.token_id_by_level)
        unStakeTimestamp = await now()
        stakeDurationTotal = stakeDurationTotal.add(unStakeTimestamp.sub(stakeTimestamp))

        const stakingRewardClaimable = await contracts.staking.claimableOf(users.user2.address)
        const stakingRewardClaimableCalc = rewardRate(charisma, dexterity).mul(stakeDurationTotal)
        expect(stakingRewardClaimable).to.equal(stakingRewardClaimableCalc)

        const achievementReward = await contracts.user.calcAchievementReward(users.user2.address, nftLevels.token_id_by_level)
        const achievementRewardCalc = BigNumber.from(envs.ACHIEVEMENT_REWARD[Level.elite.valueOf()]).mul(nftLevels.token_id_by_level.length - achievementLevelThreshold)
        assert.ok(
            achievementReward.length == 2 &&
            achievementReward[0].length == nftLevels.token_id_by_level.length &&
            achievementReward[1].eq(achievementRewardCalc)
        )

        tx = await contracts.staking.connect(users.user2).claimReward()
        await expect(tx)
            .to.emit(contracts.LYNKToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, users.user2.address, stakingRewardClaimableCalc)

        tx = await contracts.user.connect(users.user2).claimAchievementReward(nftLevels.token_id_by_level)
        const lastUpdateTime = await now()
        await expect(tx)
            .to.emit(contracts.apToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, users.user2.address, achievementRewardCalc)

        for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
            const tokenId = nftLevels.token_id_by_level[index]
            const stakeInfo = await contracts.user.stakeNFTs(tokenId)
            expect(stakeInfo.stakedDuration).to.equal(0)
            expect(stakeInfo.lastUpdateTime).to.equal(index >= achievementLevelThreshold ? lastUpdateTime : 0)
        }

        await contracts.staking.connect(users.user2).stake(nftLevels.token_id_by_level)
        await increase(10*24*60*60)
        tx = await contracts.user.connect(users.user2).claimAchievementReward(nftLevels.token_id_by_level)
        await expect(tx)
            .to.emit(contracts.apToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, users.user2.address, achievementRewardCalc)

        await increase(10*24*60*60)
        tx = await contracts.user.connect(users.user2).claimAchievementReward(nftLevels.token_id_by_level)
        await expect(tx)
            .to.emit(contracts.apToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, users.user2.address, achievementRewardCalc)
    });

});

function rewardRate(charisma: BigNumber, dexterity: BigNumber) {
    return ethers.utils.parseEther('0.007').mul(charisma)
        .add(
            ethers.utils.parseEther('0.005').mul(charisma).mul(dexterity).div(100)
        ).div(24*60*60);
}
