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
import {Attribute} from "../constants/constants";
import {signERC2612Permit} from "eth-permit";
import {increase} from "./helpers/time";

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

    it("should initializer twice?", async function () {
        await expect(
            contracts.LYNKNFT.__LYNKNFT_init()
        ).to.be.revertedWith('Initializable: contract is already initialized')
    })

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

    it('should mint NFT without approve?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        const decimalUSDT = await contracts.USDT.decimals()
        const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice)
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        ).to.be.revertedWith('baseContract: insufficient allowance')
    });

    it('should mint NFT?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)

        const decimalUSDT = await contracts.USDT.decimals()
        const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice)
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, mintPrice)

        let tx = await contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        await expect(tx)
            .to.emit(contracts.USDT, 'Transfer')
            .withArgs(randomUser.address, users.team_addr.address, mintPrice)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, 0)
        expect(await contracts.LYNKNFT.ownerOf(0)).to.equal(randomUser.address)

        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice)
        const approveParams = await signERC2612Permit(randomUser, contracts.USDT.address, randomUser.address, contracts.LYNKNFT.address, mintPrice.toString())
        tx = await contracts.LYNKNFT.connect(randomUser).mintWithPermit(
            1,
            contracts.USDT.address,
            '1',
            mintPrice,
            approveParams.deadline,
            approveParams.v,
            approveParams.r,
            approveParams.s
        )
        await expect(tx)
            .to.emit(contracts.USDT, 'Approval')
            .withArgs(randomUser.address, contracts.LYNKNFT.address, mintPrice)
        await expect(tx)
            .to.emit(contracts.USDT, 'Transfer')
            .withArgs(randomUser.address, users.team_addr.address, mintPrice)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, 1)
        expect(await contracts.LYNKNFT.ownerOf(1)).to.equal(randomUser.address)

        await increase(24*60*60)

        const mintPrice1 = BigNumber.from(envs.MINT_PRICES[1]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice1)
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, mintPrice1)
        tx = await contracts.LYNKNFT.connect(randomUser).mint(100_000, contracts.USDT.address, '100000')
        await expect(tx)
            .to.emit(contracts.USDT, 'Transfer')
            .withArgs(randomUser.address, users.team_addr.address, mintPrice1)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, 100_000)
        expect(await contracts.LYNKNFT.ownerOf(100_000)).to.equal(randomUser.address)

        const mintPrice2 = BigNumber.from(envs.MINT_PRICES[2]).mul(BigNumber.from(10).pow(decimalUSDT))
        await contracts.USDT.connect(randomUser).mint(randomUser.address, mintPrice2)
        await contracts.USDT.connect(randomUser).approve(contracts.LYNKNFT.address, mintPrice2)
        tx = await contracts.LYNKNFT.connect(randomUser).mint(200_000, contracts.USDT.address, '200000')
        await expect(tx)
            .to.emit(contracts.USDT, 'Transfer')
            .withArgs(randomUser.address, users.team_addr.address, mintPrice2)
        await expect(tx)
            .to.emit(contracts.LYNKNFT, 'Transfer')
            .withArgs(ethers.constants.AddressZero, randomUser.address, 200_000)
        await expect(await contracts.LYNKNFT.ownerOf(200_000)).to.equal(randomUser.address)

        await increase(24*60*60)
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(300_000, contracts.USDT.address, '300000')
        ).to.be.revertedWith('LYNKNFT: token id too large.')
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(200_001, ethers.constants.AddressZero, '200001')
        ).to.be.revertedWith('LYNKNFT: unsupported payment.')
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

    it('should using LYNKToken?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser1).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser1, contracts, envs, state)
        await nft_level_up(tokenId, randomUser1, BigNumber.from(envs.ACHIEVEMENT_LEVEL_THRESHOLD).toNumber(), contracts, envs)
        await contracts.LYNKNFT.connect(randomUser1).approve(contracts.staking.address, tokenId)
        await contracts.staking.connect(randomUser1).stake(tokenId)
        await increase(30*24*60*60)
        await contracts.staking.connect(randomUser1).claimReward()
        await contracts.staking.connect(randomUser1).unstake(tokenId)
        const balanceOfLYNKToken = await contracts.LYNKToken.balanceOf(randomUser1.address)
        expect(balanceOfLYNKToken).to.gte(ethers.constants.WeiPerEther)
        const point = ethers.constants.WeiPerEther.div(ethers.constants.WeiPerEther)
        const nftInfoBefore = await contracts.LYNKNFT.nftInfoOf(tokenId)
        let approveParams = await signERC2612Permit(randomUser1, contracts.LYNKToken.address, randomUser1.address, contracts.LYNKNFT.address, ethers.constants.WeiPerEther.toString())
        await contracts.LYNKNFT.connect(randomUser1).upgradeWithPermit(
            Attribute.charisma.valueOf(),
            tokenId,
            point,
            contracts.LYNKToken.address,
            ethers.constants.WeiPerEther,
            approveParams.deadline,
            approveParams.v,
            approveParams.r,
            approveParams.s
        )
        const nftInfoAfter = await contracts.LYNKNFT.nftInfoOf(tokenId)
        expect(nftInfoBefore[Attribute.charisma.valueOf()].add(point)).to.equal(nftInfoAfter[Attribute.charisma.valueOf()])
        expect(nftInfoBefore[Attribute.vitality.valueOf()]).to.equal(nftInfoAfter[Attribute.vitality.valueOf()])
        expect(nftInfoBefore[Attribute.intellect.valueOf()]).to.equal(nftInfoAfter[Attribute.intellect.valueOf()])
        expect(nftInfoBefore[Attribute.dexterity.valueOf()]).to.equal(nftInfoAfter[Attribute.dexterity.valueOf()])

        const decimalLYNKToken = await contracts.LYNKToken.decimals()
        const mintPrice = BigNumber.from(envs.MINT_PRICES[0]).mul(BigNumber.from(10).pow(decimalLYNKToken))
        expect(balanceOfLYNKToken).to.gte(mintPrice.add(ethers.constants.WeiPerEther))
        approveParams = await signERC2612Permit(randomUser1, contracts.LYNKToken.address, randomUser1.address, contracts.LYNKNFT.address, mintPrice.toString())
        await contracts.LYNKNFT.connect(randomUser1).mintWithPermit(
            state.LYNKNFT_TOKEN_ID,
            contracts.LYNKToken.address,
            `name-${state.LYNKNFT_TOKEN_ID}`,
            mintPrice,
            approveParams.deadline,
            approveParams.v,
            approveParams.r,
            approveParams.s
        )
        expect(await contracts.LYNKNFT.ownerOf(state.LYNKNFT_TOKEN_ID)).to.equal(randomUser1.address)
    });

    it('should limit by the ${maxVAAddPerDayPerToken}', async function () {
        await contracts.dbContract.connect(users.operator).setMaxVAAddPerDayPerTokens(envs.MAX_VA_ADD_PER_DAY_PER_TOKENS)
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.user.connect(randomUser).register(envs.ROOT)
        const tokenId = await mintLYNKNFTAndCheck(users.team_addr.address, randomUser, contracts, envs, state)

        const decimalAPToken = await contracts.apToken.decimals()
        await contracts.apToken.connect(randomUser)["mint(uint256)"](envs.AP_PACKAGE.length - 1, {value: BigNumber.from(envs.AP_PACKAGE[envs.AP_PACKAGE.length - 1][1])})

        const amount = BigNumber.from(envs.MAX_VA_ADD_PER_DAY_PER_TOKENS[0]).mul(2).mul(BigNumber.from(10).pow(decimalAPToken))
        await contracts.apToken.connect(randomUser).approve(contracts.LYNKNFT.address, amount)

        const nftInfoBefore = await contracts.LYNKNFT.nftInfoOf(tokenId)
        await expect(
            contracts.LYNKNFT.connect(randomUser).upgrade(Attribute.vitality.valueOf(), tokenId, amount.div(BigNumber.from(10).pow(decimalAPToken)), contracts.apToken.address)
        ).to.be.revertedWith('LYNKNFT: cannot upgrade more in a day.')

        const halfAmount = amount.div(2)
        await contracts.LYNKNFT.connect(randomUser).upgrade(Attribute.vitality.valueOf(), tokenId, halfAmount.div(BigNumber.from(10).pow(decimalAPToken)), contracts.apToken.address)

        expect((await contracts.LYNKNFT.nftInfoOf(tokenId))[Attribute.vitality.valueOf()]).to.equal(nftInfoBefore[Attribute.vitality.valueOf()].add(halfAmount.div(BigNumber.from(10).pow(decimalAPToken))))
        await expect(
            contracts.LYNKNFT.connect(randomUser).upgrade(Attribute.vitality.valueOf(), tokenId, halfAmount.div(BigNumber.from(10).pow(decimalAPToken)), contracts.apToken.address)
        ).to.be.revertedWith('LYNKNFT: cannot upgrade more in a day.')

        await increase(24*60*60)
        await contracts.LYNKNFT.connect(randomUser).upgrade(Attribute.vitality.valueOf(), tokenId, halfAmount.div(BigNumber.from(10).pow(decimalAPToken)), contracts.apToken.address)
        expect((await contracts.LYNKNFT.nftInfoOf(tokenId))[Attribute.vitality.valueOf()]).to.equal(nftInfoBefore[Attribute.vitality.valueOf()].add(amount.div(BigNumber.from(10).pow(decimalAPToken))))
    });

    it('should early bird mint while disable?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.dbContract.connect(users.operator).setWls([randomUser.address])
        await contracts.dbContract.connect(users.operator).setSwitch(false, false)

        await expect(
            contracts.user.connect(randomUser).register(envs.ROOT)
        ).to.be.revertedWith('User: cannot register yet.')
        await expect(
            contracts.LYNKNFT.connect(randomUser).mint(0, contracts.USDT.address, '0')
        ).to.be.revertedWith('LYNKNFT: cannot mint yet.')
        await expect(
            contracts.LYNKNFT.connect(randomUser).earlyBirdMint('0')
        ).to.be.revertedWith('LYNKNFT: cannot mint yet.')
    })

    it('should early bird mint while the id gt endID?', async function () {
        const randomUser = await createRandomSignerAndSendETH(users.deployer1)
        await contracts.dbContract.connect(users.operator).setWlNum(1)
        await contracts.dbContract.connect(users.operator).setWls([randomUser.address])
        await contracts.dbContract.connect(users.operator).setEarlyBirdMintIdRange(0, 1)

        await contracts.USDT.connect(randomUser).mint(randomUser.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        const approveParams = await signERC2612Permit(randomUser, contracts.USDT.address, randomUser.address, contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await contracts.LYNKNFT.connect(randomUser).earlyBirdMintWIthPermit(
            '0', 
            envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
            approveParams.deadline,
            approveParams.v,
            approveParams.r,
            approveParams.s
        )
        expect(
            await contracts.LYNKNFT.ownerOf(0)
        ).to.be.equal(randomUser.address)
        expect(
            (await contracts.user.userInfoOf(randomUser.address)).refAddress
        ).to.be.equal(envs.ROOT)

        const anotherRandomUser = await createRandomSignerAndSendETH(users.deployer1)
        await expect(
            contracts.LYNKNFT.connect(anotherRandomUser).refEarlyBirdMint(randomUser.address, '0')
        ).to.be.revertedWith('LYNKNFT: name already in used.')
        await expect(
            contracts.LYNKNFT.connect(anotherRandomUser).refEarlyBirdMint(randomUser.address, '1')
        ).to.be.revertedWith('LYNKNFT: sold out.')
    })

    it('should early bird wl work well?', async function () {
        const randomUser1 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser2 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser3 = await createRandomSignerAndSendETH(users.deployer1)
        const randomUser4 = await createRandomSignerAndSendETH(users.deployer1)

        await contracts.dbContract.connect(users.operator).setWlNum(2)
        await contracts.dbContract.connect(users.operator).setWls([randomUser1.address, randomUser2.address])
        await contracts.dbContract.connect(users.operator).setEarlyBirdMintIdRange(0, 4)

        const info1 = await contracts.LYNKNFT.earlyMintInfo();
        expect(info1._totalNum).to.be.equal(4)
        expect(info1._remainNum).to.be.equal(4)

        await contracts.USDT.connect(randomUser1).mint(randomUser1.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await contracts.USDT.connect(randomUser2).mint(randomUser2.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await contracts.USDT.connect(randomUser3).mint(randomUser3.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await contracts.USDT.connect(randomUser4).mint(randomUser4.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)

        let approveParams1 = await signERC2612Permit(randomUser1, contracts.USDT.address, randomUser1.address, contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        let approveParams2 = await signERC2612Permit(randomUser2, contracts.USDT.address, randomUser2.address, contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        let approveParams3 = await signERC2612Permit(randomUser3, contracts.USDT.address, randomUser3.address, contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        let approveParams4 = await signERC2612Permit(randomUser4, contracts.USDT.address, randomUser4.address, contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)

        await expect(
            contracts.LYNKNFT.connect(randomUser3).earlyBirdMintWIthPermit(
                '0', 
                envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
                approveParams3.deadline,
                approveParams3.v,
                approveParams3.r,
                approveParams3.s
            )
        ).to.be.revertedWith('LYNKNFT: not in the wl.')
        await expect(
            contracts.LYNKNFT.connect(randomUser3).earlyBirdMint('0')
        ).to.be.revertedWith('LYNKNFT: not in the wl.')

        await expect(
            contracts.LYNKNFT.connect(randomUser3).refEarlyBirdMint(envs.ROOT, '0')
        ).to.be.revertedWith('LYNKNFT: not in the wl.')
        await expect(
            contracts.LYNKNFT.connect(randomUser3).refEarlyBirdMintWIthPermit(
                envs.ROOT,
                '0', 
                envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
                approveParams3.deadline,
                approveParams3.v,
                approveParams3.r,
                approveParams3.s
            )
        ).to.be.revertedWith('LYNKNFT: not in the wl.')
        
        await contracts.LYNKNFT.connect(randomUser1).earlyBirdMintWIthPermit(
            '0', 
            envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
            approveParams1.deadline,
            approveParams1.v,
            approveParams1.r,
            approveParams1.s
        )
        expect(
            await contracts.LYNKNFT.ownerOf(0)
        ).to.be.equal(randomUser1.address)
        expect(
            (await contracts.user.userInfoOf(randomUser1.address)).refAddress
        ).to.be.equal(envs.ROOT)

        approveParams1 = await signERC2612Permit(randomUser1, contracts.USDT.address, randomUser1.address, contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await expect(
            contracts.LYNKNFT.connect(randomUser1).earlyBirdMintWIthPermit(
                '0', 
                envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
                approveParams1.deadline,
                approveParams1.v,
                approveParams1.r,
                approveParams1.s
            )
        ).to.be.revertedWith('LYNKNFT: already minted.')
        await expect(
            contracts.LYNKNFT.connect(randomUser1).earlyBirdMint('0')
        ).to.be.revertedWith('LYNKNFT: already minted.')

        await contracts.LYNKNFT.connect(randomUser3).refEarlyBirdMintWIthPermit(
            randomUser1.address,
            '1', 
            envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
            approveParams3.deadline,
            approveParams3.v,
            approveParams3.r,
            approveParams3.s
        )
        expect(
            await contracts.LYNKNFT.ownerOf(1)
        ).to.be.equal(randomUser3.address)
        expect(
            (await contracts.user.userInfoOf(randomUser3.address)).refAddress
        ).to.be.equal(randomUser1.address)

        approveParams3 = await signERC2612Permit(randomUser3, contracts.USDT.address, randomUser3.address, contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await expect(
            contracts.LYNKNFT.connect(randomUser3).refEarlyBirdMintWIthPermit(
                randomUser1.address,
                '1', 
                envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
                approveParams3.deadline,
                approveParams3.v,
                approveParams3.r,
                approveParams3.s
            )
        ).to.be.revertedWith('LYNKNFT: already minted.')
        await expect(
            contracts.LYNKNFT.connect(randomUser1).refEarlyBirdMint(randomUser1.address, '1')
        ).to.be.revertedWith('LYNKNFT: already minted.')

        await contracts.USDT.connect(randomUser2).approve(contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await contracts.LYNKNFT.connect(randomUser2).earlyBirdMint('2')
        expect(
            await contracts.LYNKNFT.ownerOf(2)
        ).to.be.equal(randomUser2.address)
        expect(
            (await contracts.user.userInfoOf(randomUser2.address)).refAddress
        ).to.be.equal(envs.ROOT)

        await expect(
            contracts.LYNKNFT.connect(randomUser2).earlyBirdMint('2')
        ).to.be.revertedWith('LYNKNFT: wl num limit.')
        await expect(
            contracts.LYNKNFT.connect(randomUser2).earlyBirdMintWIthPermit(
                '2',
                envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
                approveParams2.deadline,
                approveParams2.v,
                approveParams2.r,
                approveParams2.s
            )
        ).to.be.revertedWith('LYNKNFT: wl num limit.')

        await contracts.USDT.connect(randomUser4).approve(contracts.LYNKNFT.address, envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT)
        await contracts.LYNKNFT.connect(randomUser4).refEarlyBirdMint(randomUser2.address, '3')
        expect(
            await contracts.LYNKNFT.ownerOf(3)
        ).to.be.equal(randomUser4.address)
        expect(
            (await contracts.user.userInfoOf(randomUser4.address)).refAddress
        ).to.be.equal(randomUser2.address)

        await expect(
            contracts.LYNKNFT.connect(randomUser4).refEarlyBirdMint(randomUser2.address, '3')
        ).to.be.revertedWith('LYNKNFT: already minted.')
        await expect(
            contracts.LYNKNFT.connect(randomUser4).refEarlyBirdMintWIthPermit(
                randomUser2.address,
                '3',
                envs.EARLY_BIRD_MINT_PRICE_IN_PAYMENT,
                approveParams4.deadline,
                approveParams4.v,
                approveParams4.r,
                approveParams4.s
            )
        ).to.be.revertedWith('LYNKNFT: already minted.')

        const info2 = await contracts.LYNKNFT.earlyMintInfo();
        expect(info2._totalNum).to.be.equal(4)
        expect(info2._remainNum).to.be.equal(0)
    })
})