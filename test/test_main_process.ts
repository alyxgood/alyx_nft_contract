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
                const spentAmount = BigNumber.from(100).mul(BigNumber.from(10).pow(decimalUSDT))

                await expect(tx)
                    .to.emit(contracts.USDT, 'Transfer')
                    .withArgs(users.user2.address, users.team_addr.address, spentAmount)
                await expect(tx)
                    .to.emit(contracts.LYNKToken, 'Transfer')
                    .withArgs(ethers.constants.AddressZero, user2Ref.address, BigNumber.from(envs.SOCIAL_REWARD[index]).mul(spentAmount).div(BigNumber.from(10).pow(18)))
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
            await transferLYNKNFTAndCheck(users.user3, users.user4.address, tokenId, contracts)


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
