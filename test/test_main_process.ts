import {CONTRACT_FIX, get_user, set_up_fixture, USER_FIX} from "./start_up";

describe("main_process", function () {
    let users: USER_FIX
    let contracts: CONTRACT_FIX

    beforeEach(async () => {
        console.log('start test1...');

        contracts = await set_up_fixture("test_net")
        users = await get_user()


    });


    describe('main_process', () => {
        it("main_process1111", async function () {
            console.log('start test2...');
            console.log(contracts.USDT.address);
        })
    })
});
