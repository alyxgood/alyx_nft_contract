import {
    CONTRACT_FIX,
    CONTRACT_STATE,
    createRandomSignerAndSendETH,
    ENV_FIX,
    get_contract_state,
    get_env,
    get_user, mintLYNKNFTAndCheck,
    set_up_fixture,
    USER_FIX,
} from "./start_up";
import {expect} from "chai";
import {ethers} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {BNFTTest} from "../typechain-types";

describe("BNFT", function () {

    let envs: ENV_FIX
    let state: CONTRACT_STATE
    let users: USER_FIX
    let contracts: CONTRACT_FIX
    let bnftTest: BNFTTest

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

        const BNFTTest = await ethers.getContractFactory('BNFTTest')
        // @ts-ignore
        bnftTest = await (await BNFTTest.deploy()).deployed()
    });

    it("should initializer twice?", async function () {
        await expect(
            contracts.sLYNKNFT.initialize(
                contracts.LYNKNFT.address,
                'sLYNKNFT',
                'sLYNKNFT'
            )
        ).to.be.revertedWith('Initializable: contract is already initialized')
    })

    it('should mint?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.sLYNKNFT.connect(randomUser).mint(randomUser.address, 0)
        ).to.be.revertedWith('BNFT: caller is not contract')

        await contracts.user.connect(randomUser).register(envs.ROOT)
        const tokenId = mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)
        await expect(
            bnftTest.connect(randomUser).mintDirect(contracts.sLYNKNFT.address, tokenId)
        ).to.be.revertedWith('BNFT: caller is not owner')

        await contracts.LYNKNFT.connect(randomUser).approve(bnftTest.address, tokenId)
        await expect(
            bnftTest.connect(randomUser).mintTwice(contracts.LYNKNFT.address, contracts.sLYNKNFT.address, tokenId)
        ).to.be.revertedWith('BNFT: exist token')
    });

    it('should burn?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.sLYNKNFT.connect(randomUser).burn( 0)
        ).to.be.revertedWith('BNFT: caller is not contract')
        await expect(
            bnftTest.connect(randomUser).burn(contracts.sLYNKNFT.address, 0)
        ).to.be.revertedWith('BNFT: nonexist token')

        await contracts.user.connect(randomUser).register(envs.ROOT)
        const tokenId = mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)
        await contracts.LYNKNFT.connect(randomUser).approve(bnftTest.address, tokenId)
        await bnftTest.connect(randomUser).mint(contracts.LYNKNFT.address, contracts.sLYNKNFT.address, tokenId)
        expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(contracts.sLYNKNFT.address)
        expect(await contracts.sLYNKNFT.ownerOf(tokenId)).to.equal(randomUser.address)
        expect(await contracts.sLYNKNFT.minterOf(tokenId)).to.equal(bnftTest.address)

        const BNFTTest = await ethers.getContractFactory('BNFTTest')
        // @ts-ignore
        const bnftTest1: BNFTTest = await (await BNFTTest.deploy()).deployed()
        await expect(
            bnftTest1.burn(contracts.sLYNKNFT.address, tokenId)
        ).to.be.revertedWith('BNFT: caller is not minter')

        await bnftTest.burn(contracts.sLYNKNFT.address, tokenId)
        expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(bnftTest.address)
        await expect(contracts.sLYNKNFT.ownerOf(tokenId))
            .to.be.revertedWith('ERC721: invalid token ID')
    });

    it('should query the token uri?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)

        await contracts.dbContract.connect(users.operator).setBaseTokenURI('https://lynknft.com/')
        expect(
            await contracts.LYNKNFT.tokenURI(tokenId)
        ).to.equal(`https://lynknft.com/${tokenId}`)
        expect(
            await contracts.sLYNKNFT.tokenURI(tokenId)
        ).to.equal(`https://lynknft.com/${tokenId}`)
    });

    it('should query the minterOf?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)
        await expect(
            contracts.sLYNKNFT.minterOf(tokenId)
        ).to.be.revertedWith('BNFT: minter query for nonexistent token')

        await contracts.LYNKNFT.connect(randomUser).approve(bnftTest.address, tokenId)
        await bnftTest.connect(randomUser).mint(contracts.LYNKNFT.address, contracts.sLYNKNFT.address, tokenId)
        expect(await contracts.sLYNKNFT.minterOf(tokenId)).to.equal(bnftTest.address)
    });

    it('should transfer?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)
        await contracts.LYNKNFT.connect(randomUser).approve(bnftTest.address, tokenId)
        await bnftTest.connect(randomUser).mint(contracts.LYNKNFT.address, contracts.sLYNKNFT.address, tokenId)

        // should approve?
        await expect(
            contracts.sLYNKNFT.connect(randomUser).approve(bnftTest.address, tokenId)
        ).to.be.revertedWith('APPROVAL_NOT_SUPPORTED')

        // should setApprovalForAll?
        await expect(
            contracts.sLYNKNFT.connect(randomUser).setApprovalForAll(bnftTest.address, true)
        ).to.be.revertedWith('APPROVAL_NOT_SUPPORTED')

        // should transferFrom?
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.sLYNKNFT.connect(randomUser1).transferFrom(randomUser1.address, randomUser1.address, tokenId)
        ).to.be.revertedWith('TRANSFER_NOT_SUPPORTED')

        // should safeTransferFrom?
        await expect(
            contracts.sLYNKNFT.connect(randomUser1)["safeTransferFrom(address,address,uint256)"](randomUser1.address, randomUser1.address, tokenId)
        ).to.be.revertedWith('TRANSFER_NOT_SUPPORTED')
        await expect(
            contracts.sLYNKNFT.connect(randomUser1)["safeTransferFrom(address,address,uint256,bytes)"](randomUser1.address, randomUser1.address, tokenId, '0x')
        ).to.be.revertedWith('TRANSFER_NOT_SUPPORTED')
    });
})