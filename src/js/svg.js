/* eslint no-unused-vars: off */

/**
 * Function to create a svg element
 * @param {string} string - element name
 * @return {svgNode} - returns an svg node element
 */
function createSvgElement(string) {
  return document.createElementNS('http://www.w3.org/2000/svg', string);
}

/**
 * Function to create circle
 * @param  {obj} x Position object
 * @return {svgNode} svg circle node element
 */
function createSvgCircle({ pageX, pageY, type }) {
  const circleEl = createSvgElement('circle');
  circleEl.setAttribute('cx', pageX);
  circleEl.setAttribute('cy', pageY);
  circleEl.setAttribute('r', 10);
  circleEl.setAttribute('class', type);
  return circleEl;
}

/**
 * Function to create multiple circles
 * @param {array} positions array with positions
 * @return {svgNode} svg g node element with circles
 */
function createSvgCircles(positions) {
  const groupEl = createSvgElement('g');

  positions.forEach((position) => {
    groupEl.appendChild(createSvgCircle(position));
  });

  return groupEl;
}

/**
 * Function to create and draw an svg path element
 * @param {array} positions Array with positions
 * @return {svgNode} svg path svg node
 */
function createSvgPath(positions) {
  const pathEl = createSvgElement('path');

  let path = '';
  // Draw the beginning of the path
  path += `M ${positions[0].pageX} ${positions[0].pageY} `;

  // Remove first element
  positions.shift();

  // Draw the rest of the path
  path = positions.reduce((reduction, position) => `${reduction} L ${position.pageX} ${position.pageY} `, path);

  pathEl.setAttribute('d', path);

  return pathEl;
}

/**
 * Function to create an SVG image of the mouse path
 * @param {obj} options Attributes that are to set
 * @return {svgDocument} svg node element
 */
function createSvgDocument(width, height) {
  const svg = createSvgElement('svg');
  svg.setAttribute('viewbox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('version', '1.1');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add styles
  const styleEl = createSvgElement('style');
  styleEl.setAttribute('type', 'text/css');

  // Add styles
  styleEl.textContent = `
    circle.mouseup {
      fill: #ffeb3b;
      opacity: 0.5;
    }

    circle.mousedown {
      fill: #2196f3;
      opacity: 0.5;
    }

    path {
      fill: none;
      stroke: #ff5722;
      stroke-width: 2;
    }
  `;

  const defsEl = createSvgElement('defs');

  defsEl.appendChild(styleEl);
  svg.appendChild(defsEl);

  return svg;
}

/**
 * Function to create a svg with path
 * @param {number} width - The width of the svg
 * @param {number} height - The height of the svg
 * @param {object[]} events - Array of events with pageX and pageY properties
 * @return {elemnt} Returns an svg element;
 */
function createPath(width, height, events) {
  const svg = createSvgDocument(width, height);

  const path = createSvgPath(events.filter(event => event.type === 'mousemove'));
  const clicks = createSvgCircles(events.filter(event => event.type === 'mousedown' || event.type === 'mouseup'));

  svg.appendChild(path);
  svg.appendChild(clicks);

  return svg;
}
