/* eslint no-unused-vars: off */

/**
 * Class for creating mouse click and movement svg
 */
class ClickPathSVG {

  /**
   * Class constructor
   * @param {number} width - The width of the svg
   * @param {number} height - The height of the svg
   * @param {Object[]} [data=[]] - An array holding the events objects
   */
  constructor(width, height, data = []) {
    this.data = data.filter(_data => ['mousemove', 'mousedown', 'mouseup'].includes(_data.type));

    this.style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    this.style.setAttribute('type', 'text/css');
    this.style.textContent = 'circle.etave-circle.mouseup { fill: #ffeb3b; opacity: 0.5; } circle.etave-circle.mousedown { fill: #2196f3; opacity: 0.5; } path.etave-path { fill: none; stroke: #ff5722; stroke-width: 2; }';

    this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    this.defs.appendChild(this.style);

    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.setAttribute('class', 'etave-path');
    this.path.setAttribute('d', '');

    this.clicks = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svg.setAttribute('viewbox', `0 0 ${width} ${height}`);
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    this.svg.setAttribute('version', '1.1');

    this.svg.appendChild(this.defs);
    this.svg.appendChild(this.path);
    this.svg.appendChild(this.clicks);

    // Initialize
    this.update(this.data);
  }

  /**
   * Function to clear/reset the svg
   */
  clear() {
    while (this.clicks.firstChild) {
      this.clicks.removeChild(this.clicks.firstChild);
    }
    this.path.setAttribute('d', '');
  }

  /**
   * Function to update the svg
   * @param {Object[]} data - Array with mousemove, mousedown and mouseup event data
   */
  update(data) {
    this.updatePath(data.filter(_data => _data.type === 'mousemove'));
    this.updateClicks(data.filter(_data => _data.type === 'mousedown' || _data.type === 'mouseup'));
  }

  /**
   * Function to update the path
   * @param {Object[]} [data=[]] - Array with mousemove event data
   */
  updatePath(data = []) {
    if (data.length > 0) {
      let path = this.path.getAttribute('d');
      if (path.length === 0) {
        path = `M${data[0].pageX} ${data[0].pageY}`;
        data.shift();
      }
      path = data.reduce((_path, _data) => `${_path} L${_data.pageX} ${_data.pageY}`, path);
      this.path.setAttribute('d', path);
    }
  }

  /**
   * Function to update the clicks
   * @param {Object[]} [data=[]] - Array with mousedown/mouseup event data
   */
  updateClicks(data = []) {
    data.forEach(({ pageX, pageY, type }) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pageX);
      circle.setAttribute('cy', pageY);
      circle.setAttribute('r', 10);
      circle.setAttribute('class', `${type} etave-circle`);
      this.clicks.appendChild(circle);
    });
  }
  /**
   * Set method for setting the data
   * @param {Object[]} data - Array with mousemove, mousedown and mouseup event data
   */
  setData(data) {
    this.data = data;
    this.clear();
    this.update(data);
  }

  /**
   * Function to add data
   * @param {Object[]} data - Array with mousemove, mousedown and mouseup event data
   */
  addData(data) {
    this.data = this.data.concat(...data);
    this.update(data);
  }

  /**
   * Function to append the path to an createElementNS
   * @param {Element} target - The target element to append svg element
   */
  appendTo(target) {
    target.appendChild(this.svg);
  }

  /**
   * Get function for the svg element
   * @return {SVGElement} - The svg clickPath element
   */
  getSVG() {
    return this.svg;
  }

  /**
   * Set method for setting a attribute to the svg element
   * @param {Object} attributes - The attributes to set
   */
  setAttributes(attributes) {
    const keys = Object.keys(attributes);
    keys.forEach((key) => {
      this.svg.setAttribute(key, attributes[key]);
    });
  }
}
