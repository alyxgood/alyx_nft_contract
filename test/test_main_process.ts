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
import {increase} from "./helpers/time";

let state: CONTRACT_STATE
let envs: ENV_FIX
let users: USER_FIX
let contracts: CONTRACT_FIX
let userLevels: USER_LEVEL_FIX
let nftLevels: NFT_LEVEL_FIX

describe("main_process", function () {

    beforeEach(async () => {
        console.log('before test...');
        state = get_contract_state()
        envs = get_env()
        users = await get_user()
        contracts = await set_up_fixture("test_net")
        // 1. create fixture
        userLevels = await set_up_level(users.team_addr.address, contracts, envs, users, state)
        nftLevels = await set_up_nft_level(users.team_addr.address, users.user1, contracts, envs, state)
        // await contracts.user.connect(users.user1).register(envs.ROOT)
        // nftLevels = await set_up_nft_level(users.team_addr.address, users.user1, contracts, envs, state)
    });


    describe('main_process_1', () => {
        it("Should main process work well", async function () {
            let tx;

            // user1 buy APToken
            let user1APTBalance = await contracts.apToken.balanceOf(users.user1.address)
            for (let index = 0; index < envs.AP_PACKAGE.length; index++) {
                let tx = await contracts.apToken
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

            // user3 mint LYNKNFT
            await contracts.user.connect(users.user3).register(envs.ROOT)
            await mintLYNKNFTAndCheck(users.team_addr.address, users.user3, contracts, envs, state)

            // user3 transfer LYNKNFT to user4
            assert.ok(
                state.HOLDER_LIST.has(users.user3.address) &&
                (state.HOLDER_LIST.get(users.user3.address) as number[]).length == 1
            )
            const tokenId = (state.HOLDER_LIST.get(users.user3.address) as number[])[0]
            await transferLYNKNFTAndCheck(users.user3, users.user4.address, tokenId, contracts, state)

            // upgrade NFT

            // stake NFT
            let charisma = BigNumber.from(0)
            let dexterity = BigNumber.from(0)
            expect(await contracts.staking.claimableOf(users.user2.address)).to.equal(0);
            for (let index = 0; index < nftLevels.token_id_by_level.length; index++) {
                const nftInfo = await contracts.LYNKNFT.nftInfoOf(nftLevels.token_id_by_level[index])
                assert.ok(nftInfo.length == Attribute.intellect.valueOf() + 1)
                charisma = charisma.add(nftInfo[Attribute.charisma.valueOf()])
                dexterity = dexterity.add(nftInfo[Attribute.dexterity.valueOf()])

                await transferLYNKNFTAndCheck(users.user1, users.user2.address, nftLevels.token_id_by_level[index], contracts, state)
            }

            const balanceOfUser2Before = await contracts.LYNKToken.balanceOf(users.user2.address)
            const balanceOfUser2RefBefore = await contracts.LYNKToken.balanceOf(user2Ref.address)
            await contracts.LYNKNFT.connect(users.user2).setApprovalForAll(contracts.staking.address, true)
            tx = await contracts.staking.connect(users.user2).stake(nftLevels.token_id_by_level)
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

            const claimable = await contracts.staking.claimableOf(users.user2.address)
            const claimableCalc = rewardRate(charisma, dexterity).mul(24*60*60)
            expect(
                claimable.sub(claimableCalc)
            ).to.lt(ethers.utils.parseEther('1'))

            // user2 claim reward
            tx = await contracts.staking.connect(users.user2).claimReward()
            await expect(tx)
                .to.emit(contracts.LYNKToken, 'Transfer')
                .withArgs(ethers.constants.AddressZero, users.user2.address, claimable)
            await expect(tx)
                .to.emit(contracts.staking, 'Claim')
                .withArgs(users.user2.address, claimable)
            // const user2RefInfo = await contracts.user.userInfoOf(user2Ref.address)
            await expect(tx)
                .to.emit(contracts.LYNKToken, 'Transfer')
                .withArgs(
                    ethers.constants.AddressZero,
                    user2Ref.address,
                    BigNumber.from(envs.COMMUNITY_REWARD[/*user2RefInfo.level*/Level.divine.valueOf()][0]).mul(claimable).div(ethers.utils.parseEther('1'))
                )


            // let tx;
            //
            // // user1 register by root
            // await contracts.user.connect(users.user1).register(envs.ROOT)
            //
            //
            // // 4. user3 mint LYNKNFT by user1
            // await registerAndCheck(users.user3, users.user1.address)
            // // await mintLYNKNFTAndCheck(users.user3)
            //
            // // 5. user3 transfer LYNKNFT to user4
            // assert.ok(
            //     state.HOLDER_LIST.has(users.user3.address) &&
            //     (state.HOLDER_LIST.get(users.user3.address) as number[]).length == 1
            // )
            // const tokenId = (state.HOLDER_LIST.get(users.user3.address) as number[])[0]
            // await transferLYNKNFTAndCheck(users.user3, users.user4.address, tokenId)
            //
            // // 6. user4 upgrade by user1
            // await registerAndCheck(users.user4, users.user1.address)

        })
    })
});

function rewardRate(charisma: BigNumber, dexterity: BigNumber) {
    return ethers.utils.parseEther('0.007').mul(charisma)
        .add(
            ethers.utils.parseEther('0.005').mul(charisma).mul(dexterity).div(100)
        ).div(24*60*60);
}