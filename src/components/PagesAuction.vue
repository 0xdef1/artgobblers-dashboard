<script setup lang="ts">
import { onMounted, ref, inject, computed } from "vue"
import { DateTime } from "luxon"
import _ from "lodash"
import PAGES_ABI from "../abi/pages-abi.json"
import { drawChart } from "../lib/chart"

const web3 = inject("web3") as any
const PAGES_ADDRESS = "0x600Df00d3E42F885249902606383ecdcb65f2E02"

const chart = ref(null)
const mintData = ref([] as any[])
const ITEMS_PER_PAGE = 5
const currentPage = ref(0)
const pagePrice = ref(0)
const totalMinted = ref(0)
const communityMinted = ref(0)

const currentMints = computed(() => {
  return _(mintData.value)
    .orderBy('date','desc')
    .drop(currentPage.value * ITEMS_PER_PAGE)
    .take(ITEMS_PER_PAGE)
    .value();
});

onMounted(() => {
  loadChart();
});

async function loadChart() {
  //@ts-ignore
  let pages = new web3.eth.Contract(PAGES_ABI, PAGES_ADDRESS)

  pagePrice.value = (await pages.methods.pagePrice().call()) / 1e18
  totalMinted.value = await pages.methods.currentId().call()
  communityMinted.value = await pages.methods.numMintedForCommunity().call()

  
  let events: any[] = await pages.getPastEvents('PagePurchased', {fromBlock: 1})
  console.log('events',events)
  let mints = await Promise.all(
    events.map(async (e, i) => ({
      date: DateTime.fromSeconds((await web3.eth.getBlock(e.blockNumber)).timestamp).toJSDate(),
      total: i + 1,
      txHash: e.transactionHash,
      user: e.returnValues.user,
      id: e.returnValues.pageId,
      price: e.returnValues.price,
    }))
  )
  let mintStart = DateTime.fromSeconds(1667247600).toJSDate()
  mintData.value = mints

  let L = 9000;
  let s = 0.014;
  drawChart(
    chart.value, 
    [{ date: mintStart, total: 0 }, ...mints,{ date: DateTime.now().toJSDate(), total: mints.length }], 
    L, 
    s
  )
}

</script>

<template>
  <div class="flex flex-row justify-between gap-10">
    <div class="p-4 grow">
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-3">Pages Auction</div>
        <div class="col-span-2 ml-4"># Minted:</div>
        <div class="text-right">{{totalMinted}}</div>
        <div class="col-span-2 ml-4"># Minted For Community:</div>
        <div class="text-right">{{communityMinted}}</div>
        <div class="col-span-2 ml-4">Current Price:</div>
        <div class="text-right">{{pagePrice.toFixed(2)}} GOO</div>
      </div>
    </div>
    <div class="[background:#ffffff10] rounded-lg p-4">
        <div ref="chart" class="[width:600px] [height:300px]"></div>
    </div>
  </div>
  <div class="mt-4" v-if="mintData.length > 0">
          Recent Page Mints via GOO:
        <ul>
          <li
            class="rounded-lg [background:#ffffff10] p-4 mt-4"
            v-for="mint in currentMints"
            :key="mint.txHash"
          >
            <div class="flex flex-row justify-between items-end">
                <div><a :href="`https://artgobblers.com/page/${mint.id}`" >Page #{{mint.id}} <span class="[color:#8ef42e]">→</span></a></div>
                <div class="text-sm"><a :href="`https://etherscan.io/tx/${mint.txHash}`">{{mint.txHash.substr(0,40)}}…</a></div>
                <div>Minted by <a :href="`https://etherscan.io/address/${mint.user}`">{{mint.user.substr(0,6)}}…{{mint.user.substr(-4)}}</a></div>
                <div>{{(mint.price / 1e18).toFixed(2)}} GOO</div>
            </div>
          </li>
        </ul>
      </div>
</template>

<style scoped>
:deep(div) text {
  font-family: "Share Tech Mono";
  font-size: 12px;
}
</style>