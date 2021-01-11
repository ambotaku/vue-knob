/*
* vue-knob
*
* Canvas-based Vue component
*
* Copyright 2021 Klaus Zerbe
*
* based on  pure knob https://github.com/andrepxx/pure-knob
* Copyright 2018 - 2020 Andre Plötze
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

<template>
  <div>
    <canvas id="canvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script>
export default {
  name: "vue-gauge",
  props: {
    'height': {
      type: Number,
      default: 300
    },
    'width': {
      type: Number,
      default: 300
    },
    angleStart: {
      type: Number,
      default: -0.75 * Math.PI
    },
    angleEnd: {
      type: Number,
      default: 0.75 * Math.PI
    },
    angleOffset: {
      type: Number,
      default: -0.5 * Math.PI
    },
    colorBg: {
      type: String,
      default: '#181818'
    },
    colorFg: {
      type: String,
      default: '#ff8800'
    },
    colorLabel: {
      type: String,
      default: '#ffffff'
    },
    stringToValue: {
      type: Function,
      default: function (string) {
        return parseInt(string);
      }
    },
    valueToString: {
      type: Function,
      default: function (value) {
        return value.toString();
      }
    },
    label: {
      type: String,
      default: null
    },
    needle: {
      type: Boolean,
      default: false
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    textScale: {
      type: Number,
      default: 1.0
    },
    trackWidth: {
      type: Number,
      default: 0.4
    },
    valueMin: {
      type: Number,
      default: 0
    },
    valueMax: {
      type: Number,
      default: 100
    },
    value: {
      type: Number,
      default: 0
    }
  },
  data: function () {
    return {
      height_: this['height'],
      width_: this['width'],
      value_: this['value']
    }
  },
  mounted() {
    this._canvas = document.getElementById('canvas');
    this._ctx = this._canvas.getContext("2d");
    this.render();
  },
  methods: {
    render() {
      const actualStart = this.angleStart + this.angleOffset;
      const actualEnd = this.angleEnd + this.angleOffset;
      const label = this.label;
      const value = this.value_;
      const valueStr = this.valueToString(value);
      const valMin = this.valueMin;
      const valMax = this.valueMax;
      const relValue = (value - valMin) / (valMax - valMin);
      const relAngle = relValue * (this.angleEnd - this.angleStart);
      const angleVal = actualStart + relAngle;
      const colorTrack = this.colorBg;
      const colorFilling = this.colorFg;
      const colorLabel = this.colorLabel;
      const textScale = this.textScale;
      const trackWidth = this.trackWidth;
      const height = this.height_;
      const width = this.width_;
      const smaller = width < height ? width : height;
      const centerX = 0.5 * width;
      const centerY = 0.5 * height;
      const radius = 0.4 * smaller;
      const labelY = centerY + radius;
      const lineWidth = Math.round(trackWidth * radius);
      const labelSize = Math.round(0.8 * lineWidth);
      const labelSizeString = labelSize.toString();
      const fontSize = (0.2 * smaller) * textScale;
      const fontSizeString = fontSize.toString();
      const ctx = this._ctx;

      /*
       * Clear the canvas.
       */
      ctx.clearRect(0, 0, width, height);

      /*
       * Draw the track.
       */
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, actualStart, actualEnd);
      ctx.lineCap = 'butt';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = colorTrack;
      ctx.stroke();

      /*
       * Draw the filling.
       */
      ctx.beginPath();

      /*
       * Check if we're in needle mode.
       */
      if (this.needle) {
        ctx.arc(centerX, centerY, radius, angleVal - 0.01, angleVal + 0.01);
      } else {
        ctx.arc(centerX, centerY, radius, actualStart, angleVal);
      }

      ctx.lineCap = 'butt';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = colorFilling;
      ctx.stroke();

      /*
       * Draw the number.
       */
      ctx.font = fontSizeString + 'px sans-serif';
      ctx.fillStyle = colorFilling;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(valueStr, centerX, centerY);

      /*
       * Draw the label
       */
      if (label !== null) {
        ctx.font = labelSizeString + 'px sans-serif';
        ctx.fillStyle = colorLabel;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, centerX, labelY);
      }

      /*
       * Set the color and font size of the input element.

      const elemInput = this._input;
      elemInput.style.color = colorFilling;
      elemInput.style.fontSize = fontSizeString + 'px';

       */
    },
    mouseEventToValue(e, properties) {
      const canvas = e.target;
      const width = canvas.scrollWidth;
      const height = canvas.scrollHeight;
      const centerX = 0.5 * width;
      const centerY = 0.5 * height;
      const x = e.offsetX;
      const y = e.offsetY;
      const relX = x - centerX;
      const relY = y - centerY;
      const angleStart = properties.angleStart;
      const angleEnd = properties.angleEnd;
      const angleDiff = angleEnd - angleStart;
      let angle = Math.atan2(relX, -relY) - angleStart;
      const twoPi = 2.0 * Math.PI;

      /*
       * Make negative angles positive.
       */
      if (angle < 0) {

        if (angleDiff >= twoPi) {
          angle += twoPi;
        } else {
          angle = 0;
        }

      }

      const valMin = this.valueMin
      const valMax = this.valueMax;
      let value = ((angle / angleDiff) * (valMax - valMin)) + valMin;

      /*
       * Clamp values into valid interval.
       */
      if (value < valMin) {
        value = valMin;
      } else if (value > valMax) {
        value = valMax;
      }

      return value;
    },
    touchEventToValue(e, properties) {
      const canvas = e.target;
      const rect = canvas.getBoundingClientRect();
      const offsetX = rect.left;
      const offsetY = rect.top;
      const width = canvas.scrollWidth;
      const height = canvas.scrollHeight;
      const centerX = 0.5 * width;
      const centerY = 0.5 * height;
      const touches = e.targetTouches;
      let touch = null;

      if (touches.length > 0) {
        touch = touches.item(0);
      }

      let x = 0.0;
      let y = 0.0;

      if (touch !== null) {
        const touchX = touch.pageX;
        x = touchX - offsetX;
        const touchY = touch.pageY;
        y = touchY - offsetY;
      }

      const relX = x - centerX;
      const relY = y - centerY;
      const angleStart = properties.angleStart;
      const angleEnd = properties.angleEnd;
      const angleDiff = angleEnd - angleStart;
      const twoPi = 2.0 * Math.PI;
      let angle = Math.atan2(relX, -relY) - angleStart;

      if (angle < 0) {

        if (angleDiff >= twoPi) {
          angle += twoPi;
        } else {
          angle = 0;
        }
      }

      const valMin = this.valueMin;
      const valMax = this.valueMax;
      let value = ((angle / angleDiff) * (valMax - valMin)) + valMin;

      if (value < valMin) {
        value = valMin;
      } else if (value > valMax) {
        value = valMax;
      }

      return value;
    }
  }
}
</script>

<style scoped>

</style>
