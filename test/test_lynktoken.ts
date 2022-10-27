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

describe("LYNK TOKEN", function () {

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

    it('should mint by a non user or staking contract?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.LYNKToken.connect(randomUser).mint(randomUser.address, ethers.constants.WeiPerEther)
        ).to.be.revertedWith('baseContract: caller not the User OR Staking contract.')
    });

    it('should mint by user or staking contract?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)

        const mockUserContract = await createRandomSignerAndSendETH(users.deployer1)
        const mockStakingContract = await createRandomSignerAndSendETH(users.deployer1)

        await contracts.dbContract.connect(users.operator).setAddresses([
            await contracts.dbContract.LYNK_TOKEN(),
            await contracts.dbContract.AP_TOKEN(),
            mockStakingContract.address,
            await contracts.dbContract.LYNKNFT(),
            await contracts.dbContract.STAKING_LYNKNFT(),
            await contracts.dbContract.LISTED_LYNKNFT(),
            await contracts.dbContract.MARKET(),
            mockUserContract.address,
            users.team_addr.address,
        ])
        expect(await contracts.dbContract.USER_INFO()).to.equal(mockUserContract.address)
        expect(await contracts.dbContract.STAKING()).to.equal(mockStakingContract.address)

        const balanceBeforeLYNKToken1 = await contracts.LYNKToken.balanceOf(randomUser1.address)
        const balanceBeforeLYNKToken2 = await contracts.LYNKToken.balanceOf(randomUser2.address)

        const tx1 = await contracts.LYNKToken.connect(mockUserContract).mint(randomUser1.address, ethers.constants.WeiPerEther)
        const tx2 = await contracts.LYNKToken.connect(mockStakingContract).mint(randomUser2.address, ethers.constants.WeiPerEther)

        expect(tx1)
            .to.emit(contracts.LYNKToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser1.address, ethers.constants.WeiPerEther)
        expect(tx2)
            .to.emit(contracts.LYNKToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser2.address, ethers.constants.WeiPerEther)

        expect((await contracts.LYNKToken.balanceOf(randomUser1.address)).sub(balanceBeforeLYNKToken1)).to.equal(ethers.constants.WeiPerEther)
        expect((await contracts.LYNKToken.balanceOf(randomUser2.address)).sub(balanceBeforeLYNKToken2)).to.equal(ethers.constants.WeiPerEther)
    });
})