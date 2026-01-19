export const normalizeHotkey = (e: KeyboardEvent | React.KeyboardEvent): string => {
  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.metaKey) parts.push('Meta');
  
  let keyName = e.key;
  if (keyName === ' ') keyName = 'Space';
  if (keyName === 'ArrowUp') keyName = 'Up';
  if (keyName === 'ArrowDown') keyName = 'Down';
  if (keyName === 'ArrowLeft') keyName = 'Left';
  if (keyName === 'ArrowRight') keyName = 'Right';
  if (keyName.length === 1) keyName = keyName.toUpperCase();
  
  // Don't add modifiers if they are the only key pressed
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    parts.push(keyName);
  }
  
  return parts.join('+');
};
