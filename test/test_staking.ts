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
import {increase, now} from "./helpers/time";
import {BigNumber} from "ethers";
import {Attribute} from "../constants/constants";

describe("staking", function () {

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

    it('should stake by the user who not a valid user?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.staking.connect(randomUser1).stake(0)
        ).to.be.revertedWith('Staking: not a valid user.')
    });

    it('should stake the nft which not belong yours?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)

        await contracts.user.connect(randomUser1).register(envs.ROOT)
        await contracts.user.connect(randomUser2).register(envs.ROOT)
        await contracts.LYNKNFT.connect(randomUser2).setApprovalForAll(contracts.staking.address, true)

        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await expect(
            contracts.staking.connect(randomUser2).stake(tokenId)
        ).to.be.revertedWith('ERC721: caller is not token owner nor approved')
        await expect(
            contracts.staking.connect(randomUser1).stake(tokenId)
        ).to.be.revertedWith('ERC721: caller is not token owner nor approved')
    });

    it('should stake the nft?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        const tokenId1 = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        const tokenId2 = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        const nftInfo1 = await contracts.LYNKNFT.nftInfoOf(tokenId1)
        const nftInfo2 = await contracts.LYNKNFT.nftInfoOf(tokenId2)
        await contracts.LYNKNFT.connect(randomUser1).setApprovalForAll(contracts.staking.address, true)
        const tx = await contracts.staking.connect(randomUser1).stake(tokenId1)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(randomUser1.address, contracts.staking.address, tokenId1)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.staking.address, contracts.sLYNKNFT.address, tokenId1)
        await expect(tx)
            .to.emit(contracts.sLYNKNFT, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser1.address, tokenId1)
        await expect(await contracts.LYNKNFT.ownerOf(tokenId1)).to.equal(contracts.sLYNKNFT.address)
        await expect(await contracts.sLYNKNFT.ownerOf(tokenId1)).to.equal(randomUser1.address)

        let stakeInfo
        stakeInfo = await contracts.staking.miningPowerOf(randomUser1.address)
        await expect(stakeInfo.charisma).to.equal(nftInfo1[Attribute.charisma.valueOf()])
        await expect(stakeInfo.dexterity).to.equal(nftInfo1[Attribute.dexterity.valueOf()])

        await contracts.staking.connect(randomUser1).stake(tokenId2)
        stakeInfo = await contracts.staking.miningPowerOf(randomUser1.address)
        await expect(stakeInfo.charisma).to.equal(nftInfo1[Attribute.charisma.valueOf()].add(nftInfo2[Attribute.charisma.valueOf()]))
        await expect(stakeInfo.dexterity).to.equal(nftInfo1[Attribute.dexterity.valueOf()].add(nftInfo2[Attribute.dexterity.valueOf()]))
    });

    it('should unstake the nft which not belong yours', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await contracts.LYNKNFT.connect(randomUser1).approve(contracts.staking.address, tokenId)
        await contracts.staking.connect(randomUser1).stake(tokenId)

        await expect(
            contracts.staking.connect(randomUser2).unstake(tokenId)
        ).to.be.revertedWith('Staking: not the owner.')

        const tx = await contracts.staking.connect(randomUser1).unstake(tokenId)
        await expect(tx)
            .to.emit(contracts.sLYNKNFT, 'Transfer')
            .withArgs(randomUser1.address, ethers.constants.AddressZero, tokenId)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.sLYNKNFT.address, contracts.staking.address, tokenId)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(contracts.staking.address, randomUser1.address, tokenId)
        await expect(await contracts.LYNKNFT.ownerOf(tokenId)).to.equal(randomUser1.address)
        await expect(contracts.sLYNKNFT.ownerOf(tokenId))
            .to.be.revertedWith('ERC721: invalid token ID')
    });

    it('should claim reward straightly?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await expect(contracts.staking.connect(randomUser1).claimReward())
            .to.be.revertedWith('Staking: cannot claim 0.')
    });

    it('should claim the reward correctly?', async function () {
        let tx
        let stakedTime, unStakedTime

        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        const tokenId1 = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await nft_level_up(tokenId1, randomUser1, 1, contracts, envs)
        const nftInfo1 = await contracts.LYNKNFT.nftInfoOf(tokenId1)
        await contracts.LYNKNFT.connect(randomUser1).setApprovalForAll(contracts.staking.address, true)
        await contracts.staking.connect(randomUser1).stake(tokenId1)
        stakedTime = await now()

        await increase(24*60*60)
        tx = await contracts.staking.connect(randomUser1).claimReward()
        unStakedTime = await now()
        await expect(tx)
            .to.emit(contracts.LYNKToken, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser1.address, rewardRate(nftInfo1[Attribute.charisma.valueOf()], nftInfo1[Attribute.dexterity.valueOf()]).mul(unStakedTime.sub(stakedTime)))
        const balanceLYNKTokenBefore = await contracts.LYNKToken.balanceOf(randomUser1.address)
        await expect(balanceLYNKTokenBefore).to.equal(rewardRate(nftInfo1[Attribute.charisma.valueOf()], nftInfo1[Attribute.dexterity.valueOf()]).mul(unStakedTime.sub(stakedTime)))

        await increase(24*60*60)
        let reward = rewardRate(nftInfo1[Attribute.charisma.valueOf()], nftInfo1[Attribute.dexterity.valueOf()]).mul(24*60*60)

        const tokenId2 = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await nft_level_up(tokenId2, randomUser1, 1, contracts, envs)
        const nftInfo2 = await contracts.LYNKNFT.nftInfoOf(tokenId2)

        await contracts.staking.connect(randomUser1).stake(tokenId2)
        stakedTime = await now()

        await increase(24*60*60)
        tx = await contracts.staking.connect(randomUser1).claimReward()
        unStakedTime = await now()

        reward = reward.add(rewardRate(nftInfo1[Attribute.charisma.valueOf()].add(nftInfo2[Attribute.charisma.valueOf()]), nftInfo1[Attribute.dexterity.valueOf()].add(nftInfo2[Attribute.dexterity.valueOf()])).mul(unStakedTime.sub(stakedTime)))
        const balanceLYNKToken = await contracts.LYNKToken.balanceOf(randomUser1.address)
        expect(balanceLYNKToken.sub(reward).sub(balanceLYNKTokenBefore)).to.lt(balanceLYNKToken.mul(3).div(100))
    });
})

function rewardRate(charisma: BigNumber, dexterity: BigNumber) {
    return ethers.utils.parseEther('0.007').mul(charisma)
        .add(
            ethers.utils.parseEther('0.005').mul(charisma).mul(dexterity).div(100)
        ).div(24*60*60);
}