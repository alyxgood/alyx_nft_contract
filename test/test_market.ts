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
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";

describe("market", function () {

    let envs: ENV_FIX
    let state: CONTRACT_STATE
    let users: USER_FIX
    let contracts: CONTRACT_FIX
    let tokenId: number
    let randomUser: SignerWithAddress

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
        randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        await contracts.LYNKNFT.connect(randomUser).setApprovalForAll(contracts.market.address, true)
        tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)
    });

    it('should list by the user who not a valid user?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.market.connect(randomUser1).listNFT(0, ethers.constants.AddressZero, 0)
        ).to.be.revertedWith('Market: not a valid user.')
    });

    it('should list the nft which not belong yours?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)

        await contracts.user.connect(randomUser1).register(envs.ROOT)
        await contracts.LYNKNFT.connect(randomUser1).setApprovalForAll(contracts.market.address, true)

        await expect(
            contracts.market.connect(randomUser1).listNFT(tokenId, ethers.constants.AddressZero, 0)
        ).to.be.revertedWith('Market: not the owner.')
        await expect(
            contracts.market.connect(randomUser).listNFT(tokenId, contracts.apToken.address, 0)
        ).to.be.revertedWith('Market: unsupported token.')
        await expect(
            contracts.market.connect(randomUser).listNFT(tokenId, ethers.constants.AddressZero, 0)
        ).to.be.revertedWith('Market: Cannot trade yet.')
    });

    it('should list nft?', async function () {
        await nft_level_up(tokenId, randomUser, BigNumber.from(envs.SELLING_LEVEL_LIMIT).toNumber(), contracts, envs)
        const tx = await contracts.market.connect(randomUser).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(randomUser.address, contracts.market.address, tokenId)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.market.address, contracts.lLYNKNFT.address, tokenId)
        await expect(tx)
            .to.emit(contracts.lLYNKNFT, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, tokenId)
        await expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(contracts.lLYNKNFT.address)
        await expect(await contracts.lLYNKNFT.ownerOf(tokenId)).to.equal(randomUser.address)

        const listInfo = await contracts.market.listNFTs(0)
        expect(listInfo.tokenId).to.equal(tokenId)
        expect(listInfo.seller).to.equal(randomUser.address)
        expect(listInfo.acceptToken).to.equal(ethers.constants.AddressZero)
        expect(listInfo.priceInAcceptToken).to.equal(ethers.constants.WeiPerEther)
    });

    it('should cancel the nft which not belong yours or not exists nft?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)

        await nft_level_up(tokenId, randomUser, BigNumber.from(envs.SELLING_LEVEL_LIMIT).toNumber(), contracts, envs)
        await contracts.market.connect(randomUser).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)

        await expect(
            contracts.market.connect(randomUser).cancelList(1, 0)
        ).to.be.revertedWith('Market: index overflow.')
        await expect(
            contracts.market.connect(randomUser1).cancelList(0, tokenId)
        ).to.be.revertedWith('Market: seller mismatch.')
        await expect(
            contracts.market.connect(randomUser).cancelList(0, tokenId+1)
        ).to.be.revertedWith('Market: token id mismatch.')
    });

    it('should cancel the nft correctly?', async function () {
        await nft_level_up(tokenId, randomUser, BigNumber.from(envs.SELLING_LEVEL_LIMIT).toNumber(), contracts, envs)
        await contracts.market.connect(randomUser).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)
        const tx = await contracts.market.connect(randomUser).cancelList(0, tokenId)

        await expect(tx)
            .to.emit(contracts.lLYNKNFT, 'Transfer')
            .withArgs(randomUser.address, ethers.constants.AddressZero, tokenId)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.lLYNKNFT.address, contracts.market.address, tokenId)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.market.address, randomUser.address, tokenId)
        await expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(randomUser.address)
        await expect(contracts.lLYNKNFT.ownerOf(tokenId))
            .to.be.revertedWith('ERC721: invalid token ID')
        await expect(contracts.market.listNFTs(0))
            .to.be.revertedWith('CALL_EXCEPTION')
    });

    it('should take by the user who not a valid user?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.market.connect(randomUser1).listNFT(0, ethers.constants.AddressZero, 0)
        ).to.be.revertedWith('Market: not a valid user.')
    });

    it('should take the nft which not exists?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        await nft_level_up(tokenId, randomUser, BigNumber.from(envs.SELLING_LEVEL_LIMIT).toNumber(), contracts, envs)
        await contracts.market.connect(randomUser).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)
        await expect(contracts.market.connect(randomUser1).takeNFT(0, tokenId+1))
            .to.be.revertedWith('Market: token id mismatch.')
    });

    it('should take the nft with sending lower or higher value?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        await nft_level_up(tokenId, randomUser, BigNumber.from(envs.SELLING_LEVEL_LIMIT).toNumber(), contracts, envs)
        await contracts.market.connect(randomUser).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)

        await expect(
            contracts.market.connect(randomUser1).takeNFT(0, tokenId, {value: ethers.constants.WeiPerEther.sub(1)})
        ).to.be.revertedWith('Market: value mismatch.')
        await expect(
            contracts.market.connect(randomUser1).takeNFT(0, tokenId, {value: ethers.constants.WeiPerEther.add(1)})
        ).to.be.revertedWith('Market: value mismatch.')
    });

    it('should take the nft correctly?', async function () {
        const buyer = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(buyer).register(envs.ROOT)
        await nft_level_up(tokenId, randomUser, BigNumber.from(envs.SELLING_LEVEL_LIMIT).toNumber(), contracts, envs)
        let tx = await contracts.market.connect(randomUser).listNFT(tokenId, ethers.constants.AddressZero, ethers.constants.WeiPerEther)
        await tx.wait()
        const sellerBalanceBefore = await randomUser.getBalance()
        const buyerBalanceBefore = await buyer.getBalance()
        tx = await contracts.market.connect(buyer).takeNFT(0, tokenId, {value: ethers.constants.WeiPerEther})
        await expect(tx)
            .to.emit(contracts.lLYNKNFT, 'Transfer')
            .withArgs(randomUser.address, ethers.constants.AddressZero, tokenId)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.lLYNKNFT.address, contracts.market.address, tokenId)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.market.address, buyer.address, tokenId)
        await expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(buyer.address)
        await expect(contracts.lLYNKNFT.ownerOf(tokenId))
            .to.be.revertedWith('ERC721: invalid token ID')
        await expect(contracts.market.listNFTs(0))
            .to.be.revertedWith('CALL_EXCEPTION')
        const fee = ethers.constants.WeiPerEther.mul(BigNumber.from(envs.TRADING_FEE)).div(ethers.constants.WeiPerEther)
        await expect(await randomUser.getBalance()).to.equal(sellerBalanceBefore.add(ethers.constants.WeiPerEther).sub(fee))
        const rx = await tx.wait()
        await expect(await buyer.getBalance()).to.equal(buyerBalanceBefore.sub(ethers.constants.WeiPerEther).sub(rx.gasUsed.mul(rx.effectiveGasPrice)))
    });
})