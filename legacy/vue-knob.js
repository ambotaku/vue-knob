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

// eslint-disable-next-line no-undef
Vue.component("vue-knob", {
  name: "vue-knob",
  template: `
  <div id="knob" :width="width" :height="height"
         :style="{display:'inline-block',position:'relative',textAlign:'center'}">
    <canvas ref="cv" :width="width" :height="height"
            @mousedown.prevent="mouseDownListener" @mousemove.prevent="mouseMoveListener"
            @mouseup.prevent="mouseUpListener" @mouseleave.prevent="mouseCancelListener"
            @wheel.prevent="scrollListener" @dblclick.prevent="doubleClickListener"
            @touchStartListener="touchStartListener" @touchMoveListener="touchMoveListener"
            @touchEndListener="touchEndListener"  @touchCancelListener="touchCancelListener">
    </canvas>
    <div id="inputDiv" v-show="editable_" :style="{left:0,right:0,top:0,bottom:0,position:'absolute'}">
      <input type="number" ref="input" id="input"
             :style="{fontSize: fontSizeString_+'px',color: color_ ,width: '150px', margin: 'auto', textAlign: 'center', padding: 0}"
             @keyup="keyUpListener">
    </div>
  </div>
  `,
  props: {
    height: {
      type: Number,
      default: 300
    },
    width: {
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
      type: String,
      default: "0"
    }
  },

  data: function () {
    return {
      height_: this.height,
      width_: this.width,
      value_: this.value,
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

    this._previousValue = 0;
    this._mousebutton = false;
    this._touchCount = 0;
    this._timeoutDoubleTap = 0;
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


      // clear the canvas
      ctx.clearRect(0, 0, width, height);


      // draw the track
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, actualStart, actualEnd);
      ctx.lineCap = 'butt';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = colorTrack;
      ctx.stroke();

      // draw the filling
      ctx.beginPath();

      // check if we're in needle mode
      if (this.needle) {
        ctx.arc(centerX, centerY, radius, angleVal - 0.02, angleVal + 0.02);
      } else {
        ctx.arc(centerX, centerY, radius, actualStart, angleVal);
      }

      ctx.lineCap = 'butt';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = colorFilling;
      ctx.stroke();

      // draw the number
      ctx.font = this.fontSizeString_ + 'px sans-serif';
      ctx.fillStyle = colorFilling;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(valueStr, centerX, centerY);

      // draw the label
      if (label !== null) {
        ctx.font = labelSizeString + 'px sans-serif';
        ctx.fillStyle = colorLabel;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, centerX, labelY);
      }
    },

    // Sets the committed value of this knob.
    setValue(value) {
      this.setValueFloating(value);
      this.commit();
    },

    // set temporary value during knob operation
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

    // delay needed for input focussing
    focusInput() {
      window.setTimeout(() => this._input.focus(), 1);
    },

    // mouse position to value
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
      const angleDiff = this.angleEnd - this.angleStart;
      let angle = Math.atan2(relX, -relY) - this.angleStart;
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

    // handle mouse double click
    doubleClickListener() {
      const readonly = this.readOnly;

      if (!readonly) {
        this.editable_ = true;
        this.render();
        this.focusInput();
      }
    },

    // start mouse tracking
    mouseDownListener(e) {
      const btn = e.buttons;

      if (btn === 1) { // left button
        if (!this.readOnly) { // gauge mode
          const val = this.mouseEventToValue(e);
          this.setValueFloating(val);
        }
        this._mousebutton = true;
      }

      if (btn === 4) {  // middle button
        if (!this.readOnly) {
          this.editable_ = true;
          this._input.value = '';
          this.render();
          this.focusInput();
        }
      }
    },

    // mouse tracking
    mouseMoveListener(e) {
      if (this._mousebutton) {
        if (!this.readOnly) {
          const val = this.mouseEventToValue(e);
          this.setValueFloating(val);
        }
      }
    },

    // end mouse tracking
    mouseUpListener(e) {
      if (this._mousebutton) {
        if (!this.readOnly) {
          const val = this.mouseEventToValue(e);
          this.setValue(val);
        }
      }
      this._mousebutton = false;
    },

    // cancel mouse tracking
    mouseCancelListener() {
      if (this._mousebutton) {
        this.abort();
        this._mousebutton = false;
      }
    },

    // handle mouse wheel
    scrollListener(e) {
      if (!this.readOnly) {
        const delta = e.deltaY;
        const direction = delta > 0 ? 1 : (delta < 0 ? -1 : 0);
        let val = this.value_;
        val += direction;
        this.setValueFloating(val);

        window.clearTimeout(this._timeout);
        this._timeout = window.setTimeout(() => this.commit(), 250);
      }
    },

    // keyboard handler
    keyUpListener(e) {
      const key = e.key;
      if ((key === 'Enter') || (key === 'Escape')) {
        this.editable_ = false;
        const input = e.target;

        if (key === 'Enter') {
          const val = this.stringToValue(input.value);
          const valid = isFinite(val);

          if (valid) {
            this.setValue(val);
          }
        }

        input.value = '';
      }
    },

    // rollback changed value
    abort() {
      this.value_ = this._previousValue;
      this.render();
    },

    // commit value change
    commit() {
      this._previousValue = this.value_;
      this.render();
      this.$emit('value-changed', this.value_);
    },

    // touch position to value
    touchEventToValue(e) {
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

      // if there are touches, extract the first one.
      if (touches.length > 0) {
        touch = touches.item(0);
      }

      let x = 0.0;
      let y = 0.0;

      // If a touch was extracted, calculate coordinates relative to
      // the element position.
      if (touch !== null) {
        const touchX = touch['pageX'];
        x = touchX - offsetX;
        const touchY = touch['pageY'];
        y = touchY - offsetY;
      }

      const relX = x - centerX;
      const relY = y - centerY;
      const angleDiff = this.angleEnd - this.angleStart;
      const twoPi = 2.0 * Math.PI;
      let angle = Math.atan2(relX, -relY) - this.angleStart;

      // make negative angles positive.
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

      // clamp values into valid interval.
      if (value < valMin) {
        value = valMin;
      } else if (value > valMax) {
        value = valMax;
      }

      return value;
    },

    // handle touch start
    touchStartListener(e) {
      // if knob is not read-only, process touch event.
      if (!this.readOnly) {
        const touches = e.targetTouches;
        const numTouches = touches.length;
        const singleTouch = (numTouches === 1);

        // only process single touches, not multi-touch gestures
        if (singleTouch) {
          this._mousebutton = true;

          // if this is the first touch, bind double tap interval interval.
          if (this._touchCount === 0) {
            let timeout = this._timeoutDoubleTap;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => {
              /*
               * If control was tapped exactly
               * twice, enable on-screen keyboard.
               */
              if (this._touchCount === 2) {
                if (!this.readOnly) {
                  e.preventDefault();
                  this.editable_ = true;
                  this.render();
                  this.focusInput();
                }
              }

              this._touchCount = 0;
            }, 500);
            this._timeoutDoubleTap = timeout;
          }

          this._touchCount++;
          const val = this.touchEventToValue(e);
          this.setValueFloating(val);
        }
      }
    },

    touchMoveListener(e) {
      if (this._mousebutton) {
        if (!this.readOnly) {
          const touches = e.targetTouches;
          const numTouches = touches.length;
          const singleTouch = (numTouches === 1);

          // only process single touches, not multi-touch
          if (singleTouch) {
            e.preventDefault();
            const val = this.touchEventToValue(e);
            this.setValueFloating(val);
          }
        }
      }
    },

    // this is called when a user lifts a finger off the element.
    touchEndListener(e) {
      if (this._mousebutton) {
        if (!this.readOnly) {
          const touches = e.targetTouches;
          const numTouches = touches.length;
          const noMoreTouches = (numTouches === 0);

          if (noMoreTouches) {
            e.preventDefault();
            this._mousebutton = false;
            this.commit();
          }
        }
      }

      this._mousebutton = false;
    },

    // cancel touch processing
    touchCancelListener() {
      if (this._mousebutton) {
        this.abort();
        this._touchCount = 0;
        const timeout = this._timeoutDoubleTap;
        window.clearTimeout(timeout);
      }

      this._mousebutton = false;
    }
  }
});
