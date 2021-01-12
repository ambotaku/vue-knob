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
  <div id="knob" :width="width" :height="height">
    <canvas ref="cv" :width="width" :height="height"
      @mousedown.prevent="mouseDownListener" @mousemove.prevent="mouseMoveListener"
      @mouseup.prevent="mouseUpListener" @mouseleave.prevent="mouseCancelListener"
      @wheel.prevent="scrollListener" @dblclick.prevent="doubleClickListener">
    </canvas>
    <div id="inputDiv" v-show="editable_">
      <input type="number" ref="input" id="input" :style="{fontSize: fontSizeString_+'px', color: color_}"
             @keypress="keyPressListener">
    </div>
  </div>
</template>

<script>
export default {
  name: "vue-knob",
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
      value_: this['value'],
      editable_: false,
      fontSizeString_: null,
      color_: this.colorFg
    }
  },
  mounted() {
    this._canvas = this.$refs.cv;
    this._input = this.$refs.input;
    this._ctx = this._canvas.getContext("2d");
    const smaller = this.width_ < this.height_ ? this.width_ : this.height_;
    this._fontSize = 0.2 * smaller;
    this._mousebutton = false;
    this._previousValue = 0;
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
      const labelSizeString = labelSize.toString()
      const fontSize = this._fontSize * textScale;
      this.fontSizeString_ = fontSize.toString();
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
      ctx.font = this.fontSizeString_ + 'px sans-serif';
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
    },

    /*
     * Sets the value of this knob.
     */
    setValue(value) {
      this.setValueFloating(value);
      this.commit();
    },

    setValueFloating(value) {
      const valMin = this.valueMin;
      const valMax = this.valueMax;

      if (value < valMin) {
        value = valMin;
      } else if (value > valMax) {
        value = valMax;
      }

      this.value_ = Math.round(value);
      this.render();
    },

    mouseEventToValue(e) {
      const canvas = e.target;
      const width = canvas.scrollWidth;
      const height = canvas.scrollHeight;
      const centerX = 0.5 * width;
      const centerY = 0.5 * height;
      const x = e.offsetX;
      const y = e.offsetY;
      const relX = x - centerX;
      const relY = y - centerY;
      const angleStart = this.angleStart;
      const angleEnd = this.angleEnd;
      const angleDiff = angleEnd - angleStart;
      let angle = Math.atan2(relX, -relY) - angleStart;
      const twoPi = 2.0 * Math.PI;

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

      if (value < valMin) {
        value = valMin;
      } else if (value > valMax) {
        value = valMax;
      }

      return value;
    },

    doubleClickListener() {
      const readonly = this.readOnly;

      if (!readonly) {
        this.editable_ = true;
        this._input.focus();
      }
    },

    mouseDownListener(e) {
      const btn = e.buttons;

      if (btn === 1) {
        const readonly = this.readOnly;

        if (!readonly) {
          const val = this.mouseEventToValue(e);
          this.setValueFloating(val);
        }

        this._mousebutton = true;
      }

      if (btn === 4) {
        const readonly = this.readOnly;

        if (!readonly) {
          this.editable_ = true;
          window.setTimeout(() => console.log(this._input), 500);
          this._input.focus();
          this.render();
        }
      }
    },

    mouseMoveListener(e) {
      const btn = this._mousebutton;

      if (btn) {
        const readonly = this.readOnly;

        if (!readonly) {
          const val = this.mouseEventToValue(e);
          this.setValueFloating(val);
        }
      }
    },

    mouseUpListener(e) {
      const btn = this._mousebutton;

      if (btn) {
        const readonly = this.readOnly;

        if (!readonly) {
          const val = this.mouseEventToValue(e);
          this.setValue(val);
        }
      }

      this._mousebutton = false;
    },

    mouseCancelListener() {
      const btn = this._mousebutton;

      if (btn) {
        this.abort();
        this._mousebutton = false;
      }
    },

    scrollListener(e) {
      const readonly = this.readOnly;

      if (!readonly) {
        const delta = e.deltaY;
        const direction = delta > 0 ? 1 : (delta < 0 ? -1 : 0);
        let val = this.value_;
        val += direction;
        this.setValueFloating(val);

        let timeout =this._timeout;
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => this.commit(), 250);
        this._timeout = timeout;
      }
    },

    keyPressListener(e) {
      const key = e.key;
      if ((key === 'Enter') || (key === 'Escape')) {
        this.editable_ = false;
        const input = e.target;

        if (key === 'Enter') {
          const value = input.value;
          const val = this.stringToValue(value);
          const valid = isFinite(val);

          if (valid) {
            this.setValue(val);
          }
        }

        input.value = '';
      }
    },

    abort() {
      this.value_ = this._previousValue;
      this.render();
    },

    commit() {
      this._previousValue = this.value_;
      this.render();
      this.$emit('value-changed', this.value_);
    }
  }
}
</script>

<style scoped>
#knob {
  display: inline-block;
  position: relative;
  text-align: center;
}

#inputDiv {
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  position: absolute;
}

input {
  border-width: thin;
  color: #ff8800;
  font-family: "sans-serif";
  margin: auto;
  text-align: center;
  padding: 0;
}

</style>
