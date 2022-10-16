import {
    CONTRACT_FIX,
    CONTRACT_STATE,
    ENV_FIX, get_contract_state,
    get_user,
    get_env,
    set_up_fixture,
    set_up_level,
    USER_FIX, USER_LEVEL_FIX, mintLYNKNFTAndCheck, NFT_LEVEL_FIX, set_up_nft_level
} from "./start_up";
import {BigNumber} from "ethers";
import {assert, expect} from "chai";
import {ethers} from "hardhat";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {BigNumberish} from "@ethersproject/bignumber/src.ts/bignumber";

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
    });


    describe('main_process_1', () => {
        it("Should main process work well", async function () {
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

async function transferLYNKNFTAndCheck(from: SignerWithAddress, to: string, tokenId: BigNumberish) {
    const tx = await contracts.LYNKNFT.connect(users.user3).transferFrom(
        users.user3.address,
        users.user4.address,
        tokenId
    )
    await expect(tx)
        .to.emit(contracts.LYNKNFT, 'Transfer')
        .withArgs(users.user3.address, users.user4.address, tokenId)
    expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(users.user4.address)
}

async function registerAndCheck(user: SignerWithAddress, refAddress: string) {
    await contracts.user.connect(user).register(refAddress)
    const user3Info = await contracts.user.userInfoOf(user.address)
    expect(user3Info.refAddress).to.equal(refAddress)
}