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
    this.context.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Function to compare two scroll events
   * @param {Object} scrollA - The first scroll event object
   * @param {Object} scrollB - The second scroll event object
   * @return {boolean} Whether they are close to each other
   */
  static compare(scrollA, scrollB) {
    const differenceX = Math.abs(scrollA.scrollY - scrollB.scrollY);
    const differenceY = Math.abs(scrollA.scrollX - scrollB.scrollX);
    return differenceX < 25 && differenceY < 25;
  }

  /**
   * Function to update the canvas
   * @param {Object[]} name description
   */
  update(data) {
    const scrolls = [];
    if (data.length > 0) {
      let norm = -Infinity;

      // Iterate over scrolls to add duration and find norm value
      for (let i = 0; i < data.length - 1; i += 1) {
        const index = scrolls.findIndex(_scroll => ScrollMapCanvas.compare(_scroll, data[i]));
        if (index !== -1) {
          scrolls[index].duration += (data[i + 1].timeStamp || this.duration) - data[i].timeStamp;
          if (scrolls[index].duration > norm) norm = scrolls[index].duration;
        } else {
          const duration = (data[i + 1].timeStamp || this.duration) - data[i].timeStamp;
          scrolls.push(Object.assign({ duration }, data[i]));
          if (duration > norm) norm = duration;
        }
      }
      // Iterate over scrolls to add duration and find norm value
      for (let i = 0; i < scrolls.length; i += 1) {
        const alpha = (scrolls[i].duration / norm).toFixed(2);
        if (alpha !== '0.00') {
          this.context.fillStyle = `rgba(0,0,0,${alpha})`;
          this.context.fillRect(scrolls[i].scrollX, scrolls[i].scrollY, this.vw, this.vh);
        }
      }
      const pixels = this.context.getImageData(0, 0, this.width, this.height);

      for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i + 0] = 142; // R
        pixels.data[i + 1] = 68; // G
        pixels.data[i + 2] = 173; // B
        pixels.data[i + 3] = 255 - pixels.data[i + 3];  // A
      }

      this.context.putImageData(pixels, 0, 0);
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
