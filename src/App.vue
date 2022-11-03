<script setup lang="ts">
import { provide } from 'vue'
import GooLeaders from './components/GooLeaders.vue'
import GobblerAuction from './components/GobblerAuction.vue'
import PagesAuction from './components/PagesAuction.vue'
import Web3 from 'web3'
import Multicall from '@dopex-io/web3-multicall'

const web3 = new Web3(`https://mainnet.infura.io/v3/INFURA_KEY_HERE`)
const multicall = new Multicall({
  chainId: 1,
  provider: web3.currentProvider,
});

provide('web3', web3)
provide('multicall', multicall)

</script>

<template>
  <div class="py-10 mx-5 lg:mx-auto lg:container lg:max-w-screen-lg">
    <p class="text-right mb-2">Made by <a href="https://twitter.com/0xdef1">@0xdef1</a></p>
    <p class="text-right mb-2"><a href="https://www.desmos.com/calculator/xtczbtlpa6">GOO Calculator <span class="[color:#8ef42e]">→</span></a></p>
    <p class="text-right mb-10"><a href="https://www.desmos.com/calculator/nztc1avlvk">Sale Timing Calculator <span class="[color:#8ef42e]">→</span></a></p>
    <div class="my-20">
      <GooLeaders/>
    </div>
    <div class="my-20">
      <GobblerAuction/>
    </div>
    <div class="my-20">
      <PagesAuction/>
    </div>
  </div>
</template>