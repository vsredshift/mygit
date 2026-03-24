const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
/**
 * Reads a git object (hash) from disk and returns its header and content.
 * @param {string} hash - The hash of the object to read.
 * @returns {Object} - An object with two properties: 'header' and 'content'. 'header' is a string representing the header of the object, and 'content' is a Buffer containing the content of the object.
 * @throws {Error} - If the object is not found, or if it is malformed (i.e. it does not contain a null byte separator).
 */
function readObject(hash) {
    const gitDir = path.join(process.cwd(), '.mygit');
    const dir = hash.slice(0, 2);
    const filename = hash.slice(2);
    const objectPath = path.join(gitDir, 'objects', dir, filename);
    
    if (!fs.existsSync(objectPath)) {
        throw new Error(`Object ${hash} not found at ${objectPath}`);
    }
    
    const compressed = fs.readFileSync(objectPath);
    const decompressed = zlib.inflateSync(compressed);
    
    const nullIndex = decompressed.indexOf(0);
    
    if (nullIndex === -1) {
        throw new Error(`Malformed object ${hash}: no null byte separator`);
    }
    
    const header = decompressed.slice(0, nullIndex).toString();
    const content = decompressed.slice(nullIndex + 1);
    
    return { header, content };
}

module.exports = readObject