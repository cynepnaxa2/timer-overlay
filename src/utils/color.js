function hexToRgb(colorHex) {
  if (typeof colorHex !== 'string') return { r: 255, g: 0, b: 0 };
  let hex = colorHex.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) return { r: 255, g: 0, b: 0 };
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return { r, g, b };
}

module.exports = {
  hexToRgb
};



