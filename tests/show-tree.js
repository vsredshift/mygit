const readObject = require('../src/helpers/readObject')
const parseTree = require('../src/helpers/parseTree')

function showTree(hash, indent = '') {
  const { header, content, type } = readObject(hash);

  if (type !== 'tree') {
    console.error('The hash provided does not correspond to a tree object')
    return
  }
  
  console.log(`\n🌳 Tree ${hash}\n`);
  
  if (header.startsWith('blob')) {
    console.log(`${indent}${content.toString().slice(0, 50)}...`);
    return;
  }
  
  const entries = parseTree(content);
  
  for (const entry of entries) {
    const type = entry.mode === '40000' ? '📁' : '📄';
    console.log(`${indent}${type} ${entry.name} (${entry.hash.slice(0, 8)}...)`);
    
    if (entry.mode === '40000') {
      showTree(entry.hash, indent + '  ');
    }
  }
}

module.exports = showTree