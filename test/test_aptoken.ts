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

describe("ap token", function () {

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

    it("should unregister user can buy apToken?", async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.apToken.connect(randomUser)["mint(uint256)"](1, {value: envs.AP_PACKAGE[0][1]})
        ).to.be.revertedWith('APToken: not a valid user.')
    })

    it('should buy an invalid package?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        await expect(
            contracts.apToken.connect(randomUser)["mint(uint256)"](4)
        ).to.be.revertedWith('DBContract: index out of bounds.')
    });

    it('should buy apToken without payout?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        await expect(
            contracts.apToken.connect(randomUser)["mint(uint256)"](0)
        ).to.be.revertedWith('baseContract: invalid value.')
    });

    it('should buy apToken？', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        const balanceBeforeOrigin = await randomUser.getBalance()
        const balanceBeforeAPToken = await contracts.apToken.balanceOf(randomUser.address)
        const tx = await contracts.apToken.connect(randomUser)["mint(uint256)"](0, {value: envs.AP_PACKAGE[0][1]})
        expect(tx)
            .to.emit(contracts.apToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, envs.AP_PACKAGE[0][2])

        const rx = await tx.wait()
        expect(balanceBeforeOrigin.sub(await randomUser.getBalance()).sub(rx.gasUsed.mul(rx.effectiveGasPrice)))
            .to.eq(envs.AP_PACKAGE[0][1])
        expect((await contracts.apToken.balanceOf(randomUser.address)).sub(balanceBeforeAPToken)).to.equal(envs.AP_PACKAGE[0][2])
    });

    it('should mint by a non user contract?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.apToken.connect(randomUser)["mint(address,uint256)"](randomUser.address, ethers.constants.WeiPerEther)
        ).to.be.revertedWith('baseContract: caller not the User contract.')
    });

    it('should mint by user contract?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        const mockUserContract = await createRandomSignerAndSendETH(users.deployer1)

        await contracts.dbContract.connect(users.operator).setAddresses([
            await contracts.dbContract.LYNK_TOKEN(),
            await contracts.dbContract.AP_TOKEN(),
            await contracts.dbContract.STAKING(),
            await contracts.dbContract.LYNKNFT(),
            await contracts.dbContract.STAKING_LYNKNFT(),
            await contracts.dbContract.LISTED_LYNKNFT(),
            await contracts.dbContract.MARKET(),
            mockUserContract.address,
            users.team_addr.address,
        ])
        expect(await contracts.dbContract.USER_INFO()).to.equal(mockUserContract.address)

        const balanceBeforeAPToken = await contracts.apToken.balanceOf(randomUser.address)
        const tx = await contracts.apToken.connect(mockUserContract)["mint(address,uint256)"](randomUser.address, ethers.constants.WeiPerEther)
        expect(tx)
            .to.emit(contracts.apToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, ethers.constants.WeiPerEther)
        expect((await contracts.apToken.balanceOf(randomUser.address)).sub(balanceBeforeAPToken)).to.equal(ethers.constants.WeiPerEther)
    });
})