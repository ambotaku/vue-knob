<template>
  <div id="app">
    <h1>Color Mixer</h1>
    <!-- knobs to control RGB value -->
    <vue-knob :width=knobSize :height=knobSize color-bg="#444444" :value-min="0" :value-max="255"
               color-fg="#ff0000" label="red" value="127" @value-changed="colorChanged('r', $event)"/>
    <vue-knob :width=knobSize :height=knobSize color-bg="#444444" :value-min="0" :value-max="255"
              color-fg="#00ff00" label="green" value="127" @value-changed="colorChanged('g', $event)"/>
    <vue-knob :width=knobSize :height=knobSize color-bg="#444444" :value-min="0" :value-max="255"
              color-fg="#0000ff" label="blue" value="127" @value-changed="colorChanged('b', $event)"/>

    <!-- hat switch with compass directions with needle style -->
    <vue-knob :width=knobSize :height="knobSize" color-bg="#444444" :value-min="0" :value-max="8"
              :angle-start="-Math.PI" :angle-end="Math.PI" color-fg="#eeeeee"
              value="4" :needle="true" :string-to-value="directionToValue" :value-to-string="valueToDirection"
              @value-changed="directionChanged($event)">

    </vue-knob>
    <div id="resultPane" :style="{backgroundColor: getBackgroundColor}">
      <p class="text">CSS color code: {{getBackgroundColor}}</p>
      <p class="text">{{valueToDirection(direction)}}</p>
    </div>
  </div>
</template>

<script>
import VueKnob from "@/components/vue-knob";

// compass directions
const directions = ['S','SW','W','NW','N','NE','E','SE'];

export default {
  name: 'App',
  components: {
    VueKnob
  },

  data: function() {
    return {
      knobSize: 250,
      direction: 4,
      r: 127,
      g: 127,
      b: 127
    }
  },

  computed: {
    getBackgroundColor() {
      return '#'+ this.to2hex(this.r) + this.to2hex(this.g) + this.to2hex(this.b);
    }
  },

  methods: {
    colorChanged(color, e)  {
      this[color] = e;
    },

    directionChanged(e) {
      this.direction = e;
    },

    to2hex(n) {
      let s = n.toString(16);
      if (s.length < 2) s= '0'+s;
      return s;
    },

    // convert compass direction to internal number
    directionToValue(direction) {
      const idx = directions.findIndex(el => el === direction.toUpperCase());
      return (idx === -1) ? 0 : idx;
    },

    // convert internal number to compass direction
    valueToDirection(value) {
      return directions[Math.trunc(value % 8)];
    }
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
  background-color: black;
}

#resultPane {
  left: 0;
  right: 400px;
  top: 0;
  height: 200px;
  padding: 10px;
  border: 1px solid black;
}

h1 {
  padding: 20px;
  color: white;
}

.text {
  padding: 10px;
  font-size: 30px;
  color: white;
}
</style>
