/* eslint no-unused-vars: off */

/**
 * Function to create a canvas circle
 * @param {number} radius - The radius of the circle
 * @return {Element} - A canvas element containing the circle
 */
function createCanvasCircle(radius) {
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
 * Function to create a canvas linear gradient
 * @return {Element} - A canvas element containing the linear gradient
 */
function createCanvasGradient() {
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
 * Function to create a heatmap
 * @param {number} width - The width of the heatmap
 * @param {number} height - The height of the heatmap
 * @param {Event[]} points - An array with object containing pageX and pageY coordinates
 * @return {Element} - A canvas element containing the heatmap
 */
function createHeatmap(width, height, points) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set width and height
  canvas.width = width;
  canvas.height = height;

  const radius = 30;

  // Create cirlce
  const circle = createCanvasCircle(radius);

  // Calculate bounding box of points
  const bBox = {
    left: width,
    top: height,
    right: 0,
    bottom: 0,
  };

  points.forEach((point) => {
    if (bBox.left > point.pageX) bBox.left = point.pageX;
    if (bBox.top > point.pageY) bBox.top = point.pageY;
    if (bBox.right < point.pageX) bBox.right = point.pageX;
    if (bBox.bottom < point.pageY) bBox.bottom = point.pageY;
  });

  bBox.left -= radius;
  bBox.top -= radius;
  bBox.width = (bBox.right - bBox.left) + radius;
  bBox.height = (bBox.bottom - bBox.top) + radius;

  // Draw points
  points.forEach((point) => {
    context.drawImage(circle, point.pageX - radius, point.pageY - radius);
  });

  // Create an canvas gradient and get its pixels
  const gradient = createCanvasGradient();
  const gradientPixels = gradient.getContext('2d').getImageData(0, 0, 256, 1).data;

  // Get the context pixels
  const pixels = context.getImageData(bBox.left, bBox.top, bBox.width, bBox.height);

  // Iterate over the alpha pixels
  for (let i = 0; i < pixels.data.length; i += 4) {
    const p = pixels.data[i + 3] * 4;

    // Replace the grey scale with gradient colors
    if (p) {
      pixels.data[i + 0] = gradientPixels[p + 0];
      pixels.data[i + 1] = gradientPixels[p + 1];
      pixels.data[i + 2] = gradientPixels[p + 2];
    }
  }

  context.putImageData(pixels, bBox.left, bBox.top);

  return canvas;
}
