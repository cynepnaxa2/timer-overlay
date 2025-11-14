const { nativeImage } = require('electron');
const path = require('path');

/**
 * Creates a tray icon - a red circle matching the overlay widget
 * Uses a simple programmatically created icon
 * @returns {Electron.NativeImage}
 */
function createTrayIcon() {
  // Create icon using a simple data URL approach
  // For Windows, tray icons work best at 16x16 or 32x32
  // We'll create a simple red circle icon
  
  // Try to load from file first, if it exists
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  try {
    const fs = require('fs');
    if (fs.existsSync(iconPath)) {
      return nativeImage.createFromPath(iconPath);
    }
  } catch {}
  
  // Fallback: create a simple red circle icon using SVG data URL
  const svg = '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" fill="#ff0000" opacity="0.8"/></svg>';
  
  // Encode SVG for data URL (URL encode special characters)
  const encodedSvg = encodeURIComponent(svg);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  
  try {
    return nativeImage.createFromDataURL(dataUrl);
  } catch (err) {
    // If SVG doesn't work, try base64
    const base64Svg = Buffer.from(svg).toString('base64');
    const base64DataUrl = `data:image/svg+xml;base64,${base64Svg}`;
    return nativeImage.createFromDataURL(base64DataUrl);
  }
}

module.exports = {
  createTrayIcon
};

