function autoResize(element) {
  element.style.height = 'auto';
  element.style.height = element.scrollHeight + 'px';
}

function setupRichEditor(element, onContentChange) {
  element.addEventListener('input', () => {
    autoResize(element);
    if (onContentChange) {
      onContentChange(element.innerHTML);
    }
  });
  
  element.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    autoResize(element);
    if (onContentChange) {
      onContentChange(element.innerHTML);
    }
  });
  
  autoResize(element);
}

module.exports = {
  autoResize,
  setupRichEditor
};
