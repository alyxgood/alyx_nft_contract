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
import {BigNumber} from "ethers";
import {Attribute} from "../constants/constants";

describe("LYNKNFT", function () {

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

    it('should set the base url?', async function () {
        await contracts.dbContract.connect(users.operator).setBaseTokenURI('https://lynknft.com/')
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)

        expect(await contracts.LYNKNFT.tokenURI(tokenId)).to.equal(`https://lynknft.com/${tokenId}`)
    });

    it("should unregister user can mint LYNKNFT?", async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        ).to.be.revertedWith('LYNKNFT: not a valid user.')
    })

    it('should mint NFT?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)

        const decimalUSDT = await contracts.USDT.decimals()
        const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice)
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, mintPrice)

        const tx = await contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        await expect(tx)
            .to.emit(contracts.USDT, 'Transfer')
            .withArgs(randomUser.address, users.team_addr.address, mintPrice)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, 0)
        expect(await contracts.LYNKNFT.ownerOf(0)).to.equal(randomUser.address)
    });

    it('should mint over ${maxMintPerDayPerAddress} NFT in a day?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)

        const decimalUSDT = await contracts.USDT.decimals()
        const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice.mul(3))
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, mintPrice.mul(3))

        await contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        await contracts.LYNKNFT.connect(randomUser).mint(1, contracts.USDT.address, '1')
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(3, contracts.USDT.address, '3')
        ).to.be.revertedWith('LYNKNFT: cannot mint more in a day.')
    });

    it('should mint same token id?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)

        const decimalUSDT = await contracts.USDT.decimals()
        const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice.mul(2))
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, mintPrice.mul(2))

        await contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        ).to.be.revertedWith('LYNKNFT: name already in used.')
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '1')
        ).to.be.revertedWith('ERC721: token already minted')
    });

    it('should mint NFT when without enough USDT?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)

        const decimalUSDT = await contracts.USDT.decimals()
        const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, mintPrice.mul(2))

        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    });

    it('should upgrade the NFT which not belong yours?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)

        await contracts.user.connect(randomUser1).register(envs.ROOT)
        await contracts.user.connect(randomUser2).register(envs.ROOT)

        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await expect(
            contracts.LYNKNFT.connect(randomUser2).upgrade(Attribute.charisma.valueOf(), tokenId, 1, contracts.USDT.address)
        ).to.be.revertedWith('LYNKNFT: not the owner')
    });

    it('should upgrade the NFT by the user who are not a valid user?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.charisma.valueOf(), 0, 1, contracts.USDT.address)
        ).to.be.revertedWith('LYNKNFT: not a valid user.')
    });

    it('should front-upgrade the attribute?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)

        await expect(
            contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.dexterity.valueOf(), tokenId, 1, ethers.constants.AddressZero)
        ).to.be.revertedWith('LYNKNFT: level overflow.')
        await expect(
            contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.intellect.valueOf(), tokenId, 1, ethers.constants.AddressZero)
        ).to.be.revertedWith('LYNKNFT: level overflow.')
    });

    it('should upgrade by paying other token?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await expect(contracts.dbContract.calcTokenLevel(tokenId+1)).to.be.revertedWith('DBContract: invalid token ID.')
        expect(await contracts.dbContract.calcTokenLevel(tokenId)).to.equal(0)

        await expect(
            contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.charisma.valueOf(), tokenId, 1, ethers.constants.AddressZero)
        ).to.be.revertedWith('LYNKNFT: unsupported payment.')

        let nftInfo = await contracts.LYNKNFT.nftInfoOf(tokenId)
        const decimalUSDT = await contracts.USDT.decimals()
        let amount = BigNumber.from(envs.ATTRIBUTE_CA[0]).sub(nftInfo[Attribute.charisma.valueOf()]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser1).mint(randomUser1.address, amount)
        await contracts.USDT.connect(randomUser1).approve(contracts.LYNKNFT.address, amount)
        await contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.charisma.valueOf(), tokenId, amount.div(BigNumber.from(10).pow(decimalUSDT)), contracts.USDT.address)

        await expect(
            contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.vitality.valueOf(), tokenId, 1, ethers.constants.AddressZero)
        ).to.be.revertedWith('LYNKNFT: unsupported payment.')

        await contracts.apToken.connect(randomUser1)["mint(uint256)"](envs.AP_PACKAGE.length - 1, {value: envs.AP_PACKAGE[envs.AP_PACKAGE.length - 1][1]})
        await contracts.apToken.connect(randomUser1).approve(contracts.LYNKNFT.address, ethers.constants.MaxUint256)

        amount = BigNumber.from(envs.ATTRIBUTE_VA[0]).sub(nftInfo[Attribute.vitality.valueOf()]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.vitality.valueOf(), tokenId, amount.div(BigNumber.from(10).pow(decimalUSDT)), contracts.apToken.address)

        await expect(
            contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.intellect.valueOf(), tokenId, 1, ethers.constants.AddressZero)
        ).to.be.revertedWith('LYNKNFT: unsupported payment.')

        amount = BigNumber.from(envs.ATTRIBUTE_IN[0]).sub(nftInfo[Attribute.intellect.valueOf()]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.intellect.valueOf(), tokenId, amount.div(BigNumber.from(10).pow(decimalUSDT)), contracts.apToken.address)

        await expect(
            contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.dexterity.valueOf(), tokenId, 1, ethers.constants.AddressZero)
        ).to.be.revertedWith('LYNKNFT: unsupported payment.')

        amount = BigNumber.from(envs.ATTRIBUTE_DX[0]).sub(nftInfo[Attribute.dexterity.valueOf()]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.LYNKNFT.connect(randomUser1).upgrade(Attribute.dexterity.valueOf(), tokenId, amount.div(BigNumber.from(10).pow(decimalUSDT)), contracts.apToken.address)

        nftInfo = await contracts.LYNKNFT.nftInfoOf(tokenId)
        expect(nftInfo[Attribute.charisma.valueOf()]).to.equal(envs.ATTRIBUTE_CA[0])
        expect(nftInfo[Attribute.vitality.valueOf()]).to.equal(envs.ATTRIBUTE_VA[0])
        expect(nftInfo[Attribute.intellect.valueOf()]).to.equal(envs.ATTRIBUTE_IN[0])
        expect(nftInfo[Attribute.dexterity.valueOf()]).to.equal(envs.ATTRIBUTE_DX[0])

        expect(await contracts.dbContract.calcTokenLevel(tokenId)).to.equal(1)
    });
})