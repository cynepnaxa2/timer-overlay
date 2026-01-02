function drawHierarchyLines(todos, container) {
  if (!container) return;
  
  const hierarchy = typeof window !== 'undefined' && window.todoHierarchy 
    ? window.todoHierarchy 
    : require('./hierarchy');
  
  let svg = container.querySelector('#hierarchy-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'hierarchy-svg';
    container.insertBefore(svg, container.firstChild);
  }
  
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  const svgHeight = Math.max(container.scrollHeight, containerRect.height);
  
  svg.setAttribute('width', containerRect.width);
  svg.setAttribute('height', svgHeight);
  svg.setAttribute('viewBox', `0 0 ${containerRect.width} ${svgHeight}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  Object.assign(svg.style, {
    width: '100%',
    height: `${svgHeight}px`,
    position: 'absolute',
    top: '0',
    left: '0',
    overflow: 'visible'
  });
  
  // Use relative coordinates within the absolute-positioned SVG
  const getY = (el) => {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return rect.bottom - containerRect.top + container.scrollTop;
  };
  const getX = (el) => {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return rect.left - containerRect.left;
  };
  
  const parentTasks = todos.filter(t => 
    !t.completed && 
    hierarchy.isTaskVisible(t, todos) && 
    hierarchy.hasChildren(t, todos) && 
    !t.collapsed
  );
  
  const fragment = document.createDocumentFragment();
  
  parentTasks.forEach(parentTask => {
    const expander = container.querySelector(`.task-expander[data-task-id="${parentTask.id}"]`);
    if (!expander) return;
    
    const lineX = getX(expander);
    const lineTop = getY(expander) + 20;
    
    const lastDescendant = hierarchy.getLastVisibleDescendant(parentTask, todos);
    const lastTask = container.querySelector(`[data-task-id="${lastDescendant.id}"]`);
    if (!lastTask) return;
    
    const lineBottom = getY(lastTask);
    
    if (lineBottom > lineTop && lineX > 0) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', lineX);
      line.setAttribute('y1', lineTop);
      line.setAttribute('x2', lineX);
      line.setAttribute('y2', lineBottom);
      line.setAttribute('class', 'hierarchy-svg-line');
      fragment.appendChild(line);
    }
  });
  
  svg.replaceChildren();
  svg.appendChild(fragment);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { drawHierarchyLines };
} else {
  window.todoHierarchyLines = { drawHierarchyLines };
}

