describe('Todo Hotkeys', () => {
  function parseHotkey(hotkeyString) {
    const parts = hotkeyString.split('+').map(p => p.trim());
    const modifiers = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
    let key = null;
    
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower === 'ctrl' || lower === 'control') {
        modifiers.ctrl = true;
      } else if (lower === 'alt') {
        modifiers.alt = true;
      } else if (lower === 'shift') {
        modifiers.shift = true;
      } else if (lower === 'meta' || lower === 'cmd') {
        modifiers.meta = true;
      } else {
        key = part;
      }
    }
    
    return { modifiers, key };
  }
  
  function matchesHotkey(event, hotkeyString) {
    const parsed = parseHotkey(hotkeyString);
    const eventKey = event.key;
    const eventCode = event.code;
    
    const keyMap = {
      'Insert': 'Insert',
      'Delete': 'Delete',
      'F5': 'F5',
      'Enter': 'Enter',
      'Space': ' ',
      'Esc': 'Escape'
    };
    
    let keyMatches = false;
    if (keyMap[parsed.key]) {
      keyMatches = keyMap[parsed.key] === eventKey;
    } else if (parsed.key && parsed.key.length === 1) {
      keyMatches = parsed.key.toLowerCase() === eventKey.toLowerCase() || 
                   parsed.key === eventKey ||
                   parsed.key === eventCode;
    } else {
      keyMatches = parsed.key === eventKey || parsed.key === eventCode;
    }
    
    if (!keyMatches) return false;
    
    if (parsed.modifiers.ctrl !== event.ctrlKey) return false;
    if (parsed.modifiers.alt !== event.altKey) return false;
    if (parsed.modifiers.shift !== event.shiftKey) return false;
    if (parsed.modifiers.meta !== event.metaKey) return false;
    
    return true;
  }
  
  describe('parseHotkey', () => {
    test('should parse simple key', () => {
      const result = parseHotkey('Insert');
      expect(result.key).toBe('Insert');
      expect(result.modifiers.ctrl).toBe(false);
      expect(result.modifiers.alt).toBe(false);
      expect(result.modifiers.shift).toBe(false);
    });
    
    test('should parse key with Ctrl modifier', () => {
      const result = parseHotkey('Ctrl+N');
      expect(result.key).toBe('N');
      expect(result.modifiers.ctrl).toBe(true);
      expect(result.modifiers.alt).toBe(false);
    });
    
    test('should parse key with multiple modifiers', () => {
      const result = parseHotkey('Ctrl+Shift+R');
      expect(result.key).toBe('R');
      expect(result.modifiers.ctrl).toBe(true);
      expect(result.modifiers.shift).toBe(true);
      expect(result.modifiers.alt).toBe(false);
    });
    
    test('should parse F-keys', () => {
      const result = parseHotkey('F5');
      expect(result.key).toBe('F5');
      expect(result.modifiers.ctrl).toBe(false);
    });
  });
  
  describe('matchesHotkey', () => {
    test('should match simple key', () => {
      const event = {
        key: 'Insert',
        code: 'Insert',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
      };
      expect(matchesHotkey(event, 'Insert')).toBe(true);
    });
    
    test('should match F5', () => {
      const event = {
        key: 'F5',
        code: 'F5',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
      };
      expect(matchesHotkey(event, 'F5')).toBe(true);
    });
    
    test('should match Delete', () => {
      const event = {
        key: 'Delete',
        code: 'Delete',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
      };
      expect(matchesHotkey(event, 'Delete')).toBe(true);
    });
    
    test('should match Ctrl+N', () => {
      const event = {
        key: 'n',
        code: 'KeyN',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false
      };
      expect(matchesHotkey(event, 'Ctrl+N')).toBe(true);
    });
    
    test('should not match if modifier missing', () => {
      const event = {
        key: 'n',
        code: 'KeyN',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
      };
      expect(matchesHotkey(event, 'Ctrl+N')).toBe(false);
    });
    
    test('should not match if wrong key', () => {
      const event = {
        key: 'm',
        code: 'KeyM',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false
      };
      expect(matchesHotkey(event, 'Ctrl+N')).toBe(false);
    });
  });
});

