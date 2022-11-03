<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import GOBBLERS_ABI from '../abi/art-gobblers-abi.json'
import GOO_ABI from '../abi/goo-abi.json'
import _ from 'lodash'

const web3: any = inject('web3')
const multicall: any = inject('multicall')
const GOBBLERS_ADDRESS = '0x60bb1e2AA1c9ACAfB4d34F71585D7e959f387769'
const GOO_ADDRESS = '0x600000000a36F3cD48407e35eB7C5c910dc1f7a8'
const loading = ref(true)
const balanceData = ref([] as any[])
const addressFilter = ref('')
const sortColumn = ref('vBalance')
const currentPage = ref(0)
const ITEMS_PER_PAGE = 10
const gooSupply = ref(0)
const gooTankSupply = computed(() => {
    return _(balanceData.value).map(d => d.vBalance).sum()
})

const maxBalance = computed(() => {
  return _(balanceData.value.map(a => a.vBalance)).max()
})
const currentLeaders = computed(() => {
    return _(balanceData.value)
        .filter((d: any) => !addressFilter.value || d.address.toLowerCase().startsWith(addressFilter.value.toLowerCase()))
        .orderBy(sortColumn.value, 'desc')
        .drop(currentPage.value * ITEMS_PER_PAGE)
        .take(ITEMS_PER_PAGE)
        .value();
})

async function load() {
    loading.value = true
    //@ts-ignore
    let gobblers = new web3.eth.Contract(GOBBLERS_ABI, GOBBLERS_ADDRESS)
    let goo = new web3.eth.Contract(GOO_ABI, GOO_ADDRESS)
    gooSupply.value = (await goo.methods.totalSupply().call()) / 1e18
    let numGobblers = await gobblers.methods.currentNonLegendaryId().call()

    let gobblerData = await multicall.aggregate(
        _.range(1,+numGobblers+1)
        .map((id: number) => gobblers.methods.getGobblerData(id))
    )

    let addresses = _(gobblerData.map((d: any[]) => d[0])).uniq().value()
    let vBalances = await multicall.aggregate(
        addresses.map((a: string) => gobblers.methods.gooBalance(a))
    )
    let userData = await multicall.aggregate(
        addresses.map((a: string) => gobblers.methods.getUserData(a))
    )
    let data = _(_.zipWith(addresses, vBalances, userData, (a: string, b: any, c: any) => 
        ({address: a, vBalance: b / 1e18, gobblersOwned: +c[0], totalMultiplier: +c[1]})
    )).orderBy('vBalance', 'desc').value()

    balanceData.value = data
    loading.value = false
}

load()
</script>

<template>
    <div class="mt-6 mb-4 flex flex-row justify-between">
        <div>GOO Leaderboard</div>
        <div class="text-right">
            <input class="textBox outline-none" size="42" type="text" v-model="addressFilter" placeholder="0x..."/>
        </div>
    </div>
    <div class="rounded-lg [background:#ffffff10] p-10">
        <div v-if="loading">Loading...</div>
    <table v-else>
        <thead>
        <tr>
            <td colspan="6" class="text-right"></td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>Account</td>
            <td><span @click="sortColumn='gobblersOwned'" class="cursor-pointer"># Gobblers</span></td>
            <td><span @click="sortColumn='totalMultiplier'" class="cursor-pointer">Multiplier</span></td>
            <td><span @click="sortColumn='vBalance'" class="cursor-pointer">Total GOO</span></td>
            <td>&nbsp;</td>
        </tr>
        </thead>
        <tbody>
        <tr v-for="account in currentLeaders" :key="account.address">
            <td>{{_(balanceData).orderBy(sortColumn,'desc').value().indexOf(account)+1}}.</td>
            <td class="lowercase"><a :href="`https://etherscan.com/address/${account.address}`">{{account.address.substr(0,6)}}…{{account.address.substr(-4)}}</a></td>
            <td class="text-right">{{account.gobblersOwned}}</td>
            <td class="text-right">{{account.totalMultiplier}}x</td>
            <td class="text-right">{{account.vBalance.toFixed(2)}}</td>
            <td><div class="bar" :style="{width: `${account.vBalance / maxBalance * 300}px`, height: '14px'}"/></td>
        </tr>
        </tbody>
    </table>
    </div>
    <div class="flex flex-row justify-between mt-4" v-if="!loading">
        <div>GOO Supply: {{(gooSupply + gooTankSupply).toFixed(2)}} ({{gooSupply.toFixed(2)}} + {{gooTankSupply.toFixed(2)}})</div>
        <div class="text-right">
            <span @click="currentPage = currentPage - 1" class="cursor-pointer" v-show="currentPage > 0">&lt; prev</span>&nbsp;
            <span @click="currentPage = currentPage + 1" class="cursor-pointer" v-show="currentPage < balanceData.length / ITEMS_PER_PAGE">next &gt;</span>
        </div>
    </div>
</template>

<style scoped>
.bar {
  display: inline-block;
  height: 20px;
  background: #8ef42e;
}
td {
  padding-left: 20px;
  padding-right: 20px;
}
tbody:before {line-height:1em; content:"\200C"; display:block;}
tbody tr:hover {
  background: #ffffff10;
}
tbody {
    font-size: 20px;
}
input.textBox {
    background: #ffffff10;
    font-size: 12px;
    border-radius: 4px;
    padding: 5px;
}
</style>

