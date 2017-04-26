/* eslint no-unused-vars: off */

/**
 * Class for creating a scroll map canvas
 */
class ScrollMapCanvas {

  /**
   * Class constructor
   * @param {number} width - The width of the svg
   * @param {number} height - The height of the svg
   * @param {number} vw - The width of the viewport
   * @param {number} vh - The height of the viewport
   * @param {number} duration - The duration of the session
   * @param {Object[]} [data=[]] - An array holding the events objects
  */
  constructor(width, height, vw, vh, duration, data = []) {
    this.width = width;
    this.height = height;
    this.vw = vw;
    this.vh = vh;

    this.duration = duration;
    this.norm = -Infinity;

    this.data = ScrollMapCanvas.filterData(data);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext('2d');

    // Initialize
    this.update(this.data);
  }

  /**
   * Function to filter incoming data
   * @param {Object[]} [data] - Array with event data
   * @return {Object[]} - Filtered array with event data
   */
  static filterData(data) {
    return data.filter(_data => _data.type === 'scroll');
  }

  /**
   * Function to clear the canvas context
   */
  clear() {
    this.data = [];
    this.norm = -Infinity;
    this.context.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Function to update the canvas
   * @param {Object[]} name description
   */
  update(data) {
    const scrolls = [];
    if (data.length > 0) {
      // Iterate over events to add duration and find norm value
      if (data.length === 1) {
        scrolls.push(Object.assign({ duration: this.duration }, data[0]));
        this.norm = this.duration;
      } else {
        for (let i = 0; i < data.length - 1; i += 1) {
          const duration = (data[i + 1].timeStamp || this.duration) - data[i].timeStamp;
          if (duration > this.norm) this.norm = duration;
          scrolls.push(Object.assign({ duration }, data[i]));
        }
      }

      // Create temp canvas
      const factor = 8;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width / factor;
      tempCanvas.height = this.height / factor;
      const tempContext = tempCanvas.getContext('2d');

      const tmpVw = this.vw / factor;
      const tmpVh = this.vh / factor;

      // Iterate over scrolls to add alpha to canvas
      for (let i = 0; i < scrolls.length; i += 1) {
        const alpha = (scrolls[i].duration / this.norm).toFixed(2);
        if (alpha !== '0.00') {
          tempContext.fillStyle = `rgba(0,0,0,${alpha})`;
          tempContext.fillRect(scrolls[i].scrollX / factor, scrolls[i].scrollY / factor, tmpVw, tmpVh);
        }
      }

      const pixels = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        // pixels.data[i + 0] = 142;  // R
        // pixels.data[i + 1] = 68;   // G
        // pixels.data[i + 2] = 173;  // B
        pixels.data[i + 3] = 255 - pixels.data[i + 3];  // A
      }

      tempContext.putImageData(pixels, 0, 0);
      this.context.drawImage(tempCanvas, 0, 0, this.width, this.height);
    }
  }

  /**
   * Set method for setting the data
   * @param {Object[]} data - Array with mousemove, mousedown and mouseup event data
   */
  setData(data) {
    this.clear();
    this.data = ScrollMapCanvas.filterData(data);
    this.update(this.data);
  }

  /**
   * Function to append the path to an element
   * @param {Element} target - The target element to append the canvas element
   */
  appendTo(target) {
    target.appendChild(this.canvas);
  }

  /**
   * Get method for the canvas element
   * @return {Element} - The canvas element
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Function to set attributes to the canvas element
   * @param {Object} attributes - The attributes to set
   */
  setAttributes(attributes) {
    const keys = Object.keys(attributes);
    keys.forEach((key) => {
      this.canvas.setAttribute(key, attributes[key]);
    });
  }
}
