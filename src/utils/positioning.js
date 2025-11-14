function computeWindowBoundsForRightEdge(displayBounds, overlayWidth) {
  const x = displayBounds.x + displayBounds.width - overlayWidth;
  const y = displayBounds.y;
  return {
    x,
    y,
    width: overlayWidth,
    height: displayBounds.height
  };
}

module.exports = {
  computeWindowBoundsForRightEdge
};



