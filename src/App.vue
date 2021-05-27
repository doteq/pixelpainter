<template>
  <v-app style="background-color: #1a1a1a; overflow: visible">
    <vue-pan-zoom :options="{beforeMouseDown: beforeMouseDownHandler}" >
    <div class="content" style="width: 3200px; height: 1800px; outline: black solid">
        <canvas
            width="3200"
            height="1800"
            id="canvas"
            @mousemove="getMousePosition"
            @mousedown="mouseDown"
            @mouseup="isMouseDown = false"
        />
    </div>
    </vue-pan-zoom>
    <div class="toolbar mb-8">
      <v-card class="ma-4">
        <v-card-title>
          pixelpainter
          <v-divider vertical class="mx-3"/>
          <v-menu
              :close-on-content-click="false"
              :nudge-width="200"
              offset-x
          >
            <template v-slot:activator="{ on }">
              <v-btn
                  :color="color"
                  v-on="on"
              >
              </v-btn>
            </template>
            <v-color-picker
                v-model="color"
                show-swatches
            />
          </v-menu>
          <v-btn
              class="ml-2"
              icon
              :color="eraser ? `blue` : `gray`"
              @click="eraser = !eraser"
          >
            <v-icon>
              mdi-eraser-variant
            </v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          {{ mousePosition.x }}, {{mousePosition.y}}
          <v-divider class="mx-3" vertical/>
          {{mouseColor}}
          <v-spacer></v-spacer>
          <input type="file" @change="loadFile" ref="canvasFile" hidden>
          <v-btn icon @contextmenu="$refs['canvasFile'].click()" @click="showBackground = !showBackground">
            <v-icon :color="showBackground ? 'blue' : 'gray'">
              mdi-image
            </v-icon>
          </v-btn>
          <input type="file" @change="loadDrawing" ref="importpxl" hidden>
          <v-btn icon @contextmenu="importDrawing" @click="showDrawing = !showDrawing">
            <v-icon :color="showDrawing ? 'blue' : 'gray'">
              mdi-pencil
            </v-icon>
          </v-btn>
          <v-btn color="blue" @click="downloadDrawing">Export .pxl</v-btn>
        </v-card-title>
      </v-card>
    </div>
  </v-app>
</template>

<script>
import { saveAs } from 'file-saver';

export default {
  name: 'App',

  components: {
  },

  data: () => ({
    color: "#FFFFFF",
    mousePosition: {
      x:0,
      y:0
    },
    drawing: [],
    dialog: false,
    showBackground: true,
    showDrawing: true,
    backgroundBytes: [],
    isMouseDown: false,
    mouseColor: "#000000",
    eraser: false,
  }),
  mounted() {
    const c = document.getElementById("canvas");
    const ctx = c.getContext("2d");
    this.canvas = c
    this.ctx = ctx;
    this.generateEmptyDrawing()
    this.render()
  },
  methods: {
    beforeMouseDownHandler(e) {

      return !e.shiftKey;
    },
    mouseDown(e) {
      this.isMouseDown = true
      if(!e.shiftKey) {
        this.paint()
      }
    },
    getMousePosition(evt){
      var rect = this.canvas.getBoundingClientRect(), // abs. size of element
          scaleX = this.canvas.width / rect.width,    // relationship bitmap vs. element for X
          scaleY = this.canvas.height / rect.height;
      this.mousePosition.x = Math.floor(((evt.clientX - rect.left) * scaleX)/20)
      this.mousePosition.y = Math.floor(((evt.clientY - rect.top) * scaleY)/20)
      const p = this.ctx.getImageData(this.mousePosition.x * 20, this.mousePosition.y*20, 1, 1).data;
      this.mouseColor = "#" + ("000000" + this.rgbToHex(p[0], p[1], p[2])).slice(-6);
      if(this.isMouseDown && !evt.shiftKey){
        this.paint()
      }
    },
    importDrawing() {
      this.$refs['importpxl'].click()
    },
    loadFile(event){
      const reader = new FileReader();
      const parent = this
      reader.onload = function(e){
        const bytes = new Uint8Array(e.target.result);
        parent.backgroundBytes = [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('').match(/.{1,6}/g);
      }
      reader.readAsArrayBuffer(event.target.files[0]);
    },
    loadDrawing(event){
      const reader = new FileReader();
      const parent = this
      reader.onload = function(e){
        const bytes = new Uint8Array(e.target.result);
        parent.drawing = [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('').match(/.{1,6}/g);
      }
      reader.readAsArrayBuffer(event.target.files[0]);
    },
    drawPixel(x, y, color) {
      this.ctx.fillStyle = `#${color}`
      this.ctx.fillRect(x * 20, y * 20, 20, 20)
    },
    generateEmptyDrawing() {
      for(let y = 0; y<14400; y++) {
        this.drawing.push('000000')
      }
    },
    render(){
      this.ctx.clearRect(0, 0, 3200, 1800);
      if(this.showBackground && this.backgroundBytes.length > 0) {
        let pixel = 0
        for(let y = 0; y<90; y++) {
          for(let x = 0; x<160; x++) {
            this.drawPixel(x, y, this.backgroundBytes[pixel])
            pixel++
          }
        }
      }

      if(this.showDrawing) {
        let pixel = 0
        for(let y = 0; y<90; y++) {
          for(let x = 0; x<160; x++) {
            if(this.drawing[pixel] !== '000000') this.drawPixel(x, y, this.drawing[pixel])
            pixel++
          }
        }
      }
    },
    paint() {
      console.log('drawing')
      if(this.eraser) {
        this.drawing[this.getPixelPositionArray([this.mousePosition.x, this.mousePosition.y])] = "000000"
      } else {
        this.drawing[this.getPixelPositionArray([this.mousePosition.x, this.mousePosition.y])] = this.color.substring(1)
      }
      this.render()
    },
    rgbToHex(r, g, b) {
      if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
      return ((r << 16) | (g << 8) | b).toString(16);
    },
    downloadDrawing() {
      const pixelString = this.drawing.join("")
      saveAs(new Blob([new Uint8Array(pixelString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))], {type: 'mimeType'}), 'drawing.pxl')

    },
    getPixelPositionArray(pos) {
      return (pos[1] * 160) + pos[0]
    }
  },
  watch: {
    backgroundBytes() {
      this.render()
    },
    drawing() {
      this.render()
    },
    showBackground() {
      this.render()
    },
    showDrawing() {
      this.render()
    }
  },
};
</script>

<style>
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 75px;
}
</style>
