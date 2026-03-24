function parseTree(content) {
    if (!content || !Buffer.isBuffer(content)) {
        throw new Error('Tree content must be a Buffer');
    }
    
    if (content.length === 0) {
        return [];
    }
    
    const entries = [];
    let offset = 0;
    
    while (offset < content.length) {
        let nullPos = offset;
        while (nullPos < content.length && content[nullPos] !== 0) {
            nullPos++;
        }
        
        if (nullPos >= content.length) {
            throw new Error('Malformed tree: missing null terminator');
        }
        
        const entry = content.slice(offset, nullPos).toString();
        const spaceIndex = entry.indexOf(' ');
        
        if (spaceIndex === -1) {
            throw new Error(`Malformed tree entry: ${entry}`);
        }
        
        const mode = entry.substring(0, spaceIndex);
        const name = entry.substring(spaceIndex + 1);
        
        if (nullPos + 21 > content.length) {
            throw new Error('Malformed tree: incomplete hash');
        }
        
        const hashBytes = content.slice(nullPos + 1, nullPos + 21);
        const hash = hashBytes.toString('hex');
        
        entries.push({ mode, name, hash });
        offset = nullPos + 21;
    }
    
    return entries;
}

module.exports = parseTree