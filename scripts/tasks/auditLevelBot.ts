import {HardhatRuntimeEnvironment, TaskArguments} from "hardhat/types";
import Cache from "file-system-cache";
import {BigNumber} from "ethers";

const main = async (
    _taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment
) => {
    const cacheKey = "blockNumber"
    const cache = Cache({
        basePath: "./.cache", // Optional. Path where cache files are stored (default).
        ns: "block" // Optional. A grouping namespace for items.
    });

    const delayedBlock = process.env.delayed_block_number ? BigNumber.from(process.env.delayed_block_number).toNumber() : 12
    const deploymentsUser = await hre.deployments.get("User")
    const deploymentsNFT = await hre.deployments.get("LYNKNFT")

    const MockUSDT = await hre.ethers.getContractFactory('User')
    // @ts-ignore
    let user: User = MockUSDT.attach(deploymentsUser.address)

    while (true){
        try {
            let block = await cache.get(cacheKey, 0)
            if (block === 0) {
                block = deploymentsUser.receipt!.blockNumber
                if (block < deploymentsNFT.receipt!.blockNumber) {
                    block = deploymentsNFT.receipt!.blockNumber
                }
                await cache.set(cacheKey, block)
            }

            while (true) {
                let lastBlock = await hre.ethers.provider.getBlockNumber()
                // info(`lastBlock ${lastBlock}`)
                if (block + delayedBlock >= lastBlock){
                    await sleep(5*1000)
                } else {
                    break
                }
            }

            info(`Scanning ${block} block...`)
            const logs = await hre.ethers.provider.getLogs({
                fromBlock: block,
                toBlock: block
            })

            for (let index = 0; index < logs.length; index++) {
                let currentAddress
                if (logs[index].address === deploymentsUser.address) {
                    try {
                        const event = MockUSDT.interface.parseLog(logs[index])
                        if (event.eventFragment.name == "Register") {
                            currentAddress = event.args["account"]
                            info(`${currentAddress} Register by ${event.args["ref"]}`)
                        }
                    } catch (e) {
                        // @ts-ignore
                        if (e.reason !== "no matching event") {
                            throw e
                        }
                    }
                }
                if (logs[index].address === deploymentsNFT.address) {
                    try {
                        const event = MockUSDT.interface.parseLog(logs[index])
                        if (event.eventFragment.name == "Upgrade") {
                            currentAddress = (await hre.ethers.provider.getTransaction(logs[index].transactionHash)).from
                            info(`${currentAddress} Upgrade ${event.args["attr"]} attr ${event.args["point"]} point`)
                        }
                    } catch (e) {
                        // @ts-ignore
                        if (e.reason !== "no matching event") {
                            throw e
                        }
                    }
                }

                if (currentAddress) {
                    for (let i = 0; i < 6; i++) {
                        currentAddress = (await user.userInfoOf(currentAddress)).refAddress
                        if (currentAddress) {
                            if (currentAddress === hre.ethers.constants.AddressZero) {
                                break
                            }

                            if (await user.levelUpAble(currentAddress)) {
                                let tx = await user.auditLevel(currentAddress)
                                await tx.wait()
                                info(`auditing ${currentAddress}, hash: ${tx.hash}`)
                            }else {
                                break
                            }
                        }
                    }
                }
            }
            info(`Scan ${block} block completed...`)
            await cache.set(cacheKey, block + 1)
        }catch (e){
            info('Got an exception: ')
            console.log(e)
        }
    }
}

export function info(msg: string) {
    console.log(new Date().toLocaleString(), msg)
}

export function sleep(ms: number | undefined) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default main