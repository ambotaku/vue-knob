<template>
  <div id="app">
    <vue-knob :width=200 :height=200 colorBg="#888888" :value-min="0" :value-max="100"
               color-fg="#E0A000" color-label="#00ff00" label="teste feste"  :text-scale="1.0"
               :value="50"/>
  </div>
</template>

<script>
import VueKnob from "@/components/vue-knob";

export default {
  name: 'App',
  components: {
    VueKnob
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
