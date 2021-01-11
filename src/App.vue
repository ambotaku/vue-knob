<template>
  <div id="app">
    <vue-gauge :width=100 :height=100 colorBg="#888888" :value-min="0" :value-max="100"
               color-fg="#ff0000" color-label="#00ff00" label="teste feste"  :text-scale="1.0"
               :value="50"/>
  </div>
</template>

<script>
import VueGauge from "@/components/vue-gauge";

export default {
  name: 'App',
  components: {
    VueGauge
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
