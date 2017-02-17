/* eslint no-unused-vars: off */

/**
 * Class for creating heat map canvas
 */
class HeatMapCanvas {

  /**
   * Class constructor
   * @param {number} width - The width of the svg
   * @param {number} height - The height of the svg
   * @param {Object[]} [data=[]] - An array holding the events objects
   */
  constructor(width, height, data = [], radius = 30) {
    this.data = HeatMapCanvas.filterData(data);

    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext('2d');

    this.radius = radius;
    this.circle = HeatMapCanvas.createCircle();
    this.gradient = HeatMapCanvas.createGradient();
    this.gradientPixels = this.gradient.getContext('2d').getImageData(0, 0, 256, 1).data;

    // Initialize
    this.update(this.data);
  }

  /**
   * Function to filter incoming data
   * @param {Object[]} [data] - Array with event data
   * @return {Object[]} - Filtered array with event data
   */
  static filterData(data) {
    return data.filter(_data => ['mousemove', 'mousedown', 'mouseup', 'click'].includes(_data.type));
  }

  /**
   * Function to create a radial gradient circle
   * @param {number} radius - The radius of the circle
   * @return {Element} A canvas with the circle
   */
  static createCircle(radius = 30) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = radius * 2;
    canvas.height = radius * 2;

    const circle = context.createRadialGradient(radius, radius, radius, radius, radius, 0);
    circle.addColorStop(0, 'rgba(0,0,0,0)');
    circle.addColorStop(1, 'rgba(0,0,0,0.6)');

    context.fillStyle = circle;
    context.fillRect(0, 0, radius * 2, radius * 2);

    return canvas;
  }

  /**
   * Function to create a linear gradient for coloring the heat map
   * @return {Element} A canvas with the gradient
   */
  static createGradient() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set width and height
    canvas.width = 256;
    canvas.height = 1;

    // Create gradient
    const gradient = context.createLinearGradient(0, 0, 256, 1);

    // Add gradient stops
    gradient.addColorStop(0.4, '#0707be');
    gradient.addColorStop(0.6, '#04e9e9');
    gradient.addColorStop(0.7, '#04e104');
    gradient.addColorStop(0.8, '#d9d904');
    gradient.addColorStop(1.0, '#d11212');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 1);

    return canvas;
  }

  /**
   * Function to clear the canvas context
   */
  clear() {
    this.data = [];
    this.context.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Function to update the canvas
   * @param {Object[]} name description
   */
  update(data) {
    if (data.length > 0) {
      // Bounding box object
      const bBox = {
        top: Infinity,
        right: 0,
        bottom: 0,
        left: Infinity,
      };

      // Iterate over the new data to find the bounding box data and draw the new circles
      for (let i = 0; i < data.length; i += 1) {
        if (bBox.top > data[i].pageY) bBox.top = data[i].pageY;
        if (bBox.right < data[i].pageX) bBox.right = data[i].pageX;
        if (bBox.bottom < data[i].pageY) bBox.bottom = data[i].pageY;
        if (bBox.left > data[i].pageX) bBox.left = data[i].pageX;
        this.context.drawImage(
          this.circle,
          data[i].pageX - this.radius,
          data[i].pageY - this.radius
        );
      }

      // Fix the bounding box with the radius and add with/height
      bBox.top -= this.radius;
      bBox.right += this.radius;
      bBox.bottom += this.radius;
      bBox.left -= this.radius;
      bBox.width = bBox.right - bBox.left;
      bBox.height = bBox.bottom - bBox.top;

      // Get the pixels form the newly drawn circles
      const drawAreaPixels = this.context.getImageData(
        bBox.left,
        bBox.top,
        bBox.width,
        bBox.height
      );

      // Iterate over the alpha pixels
      for (let i = 0; i < drawAreaPixels.data.length; i += 4) {
        const p = drawAreaPixels.data[i + 3] * 4;

        // Replace the grey scale with gradient colors
        if (p) {
          drawAreaPixels.data[i + 0] = this.gradientPixels[p + 0];
          drawAreaPixels.data[i + 1] = this.gradientPixels[p + 1];
          drawAreaPixels.data[i + 2] = this.gradientPixels[p + 2];
        }
      }

      this.context.putImageData(drawAreaPixels, bBox.left, bBox.top);
    }
  }

  /**
   * Set method for setting the data
   * @param {Object[]} data - Array with mousemove, mousedown and mouseup event data
   */
  setData(data) {
    this.clear();
    this.data = HeatMapCanvas.filterData(data);
    this.update(this.data);
  }

  /**
   * Function to add data
   * @param {Object[]} data - Array with mousemove, mousedown and mouseup event data
   */
  addData(data) {
    const adds = HeatMapCanvas.filterData(data)
    this.data = this.data.concat(...adds);
    this.update(adds);
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
