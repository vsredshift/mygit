# The `inspect-object` command
The `inspect-object` command is a utility command that allows you to inspect the contents of a mygit object (blob or tree) by providing its hash. It is useful for debugging and understanding the structure of the objects in your mygit repository.

## Implementation explained
- The `inspect-object` command is implemented in the `inspectObject.js` file in the `src/commands` directory. There are three functions in this file.
    - `parseTree(buffer)` function
    - `parseObject(buffer)` function
    - `inspectObject(hash)` function. This is the main function the other two are helpers.

## Implementation of each function
- The `parseTree` function is a helper responsible for:
    - Take a decompressed buffer as input, which represents the content of a tree object.
    - It parses the buffer to extract the mode, name, and hash of each entry in the tree.
    - It logs the mode, name, and hash of each entry to the console in a human-readable format.
```javascript
function parseTree(buffer) {
    let i = 0; // Initialize an index to keep track of our position in the buffer

    // Loop through the buffer until we reach the end, extracting the mode, name, and hash of each entry in the tree
    while (i < buffer.length) {
        const spaceIndex = buffer.indexOf(32, i); // Find the index of the space character (ASCII code 32) starting from index i
        const nullIndex = buffer.indexOf(0, spaceIndex); // Find the index of the null character (ASCII code 0) starting from index spaceIndex

        const mode = buffer.slice(i, spaceIndex).toString(); // Extract the mode from the buffer and convert it to a string
        const name = buffer.slice(spaceIndex + 1, nullIndex).toString(); // Extract the name from the buffer and convert it to a string

        const hash = buffer.slice(nullIndex + 1, nullIndex + 21).toString('hex'); // Extract the hash from the buffer and convert it to a hexadecimal string
        console.log(`${mode} ${name} ${hash}`); // Log the mode, name, and hash to the console

        i = nullIndex + 21; // Move the index to the next entry in the buffer
    }
}
```

- The `parseObject` function is a helper responsible for:
    - Take a decompressed buffer as input, which represents the content of a mygit object (either a blob or a tree).
    - It parses the buffer to extract the type, size, and content of the object.
    - If the object is a blob, it logs the type, size, and content to the console. If the object is a tree, it calls the `parseTree` function to parse and log the entries in the tree.
```javascript
function parseObject(buffer) {
    // 1. Find the index of the null character "\0" (ASCII code 0) in the buffer, which separates the header from the content
    const nullIndex = buffer.indexOf(0);

    // 2. Extract the header from the buffer and convert it to a string
    const header = buffer.slice(0, nullIndex).toString();

    // 3. Extract the content from the buffer, which is the part after the null character
    const content = buffer.slice(nullIndex + 1);

    // 4. Split the header into type and size using a space as the delimiter
    const [type, size] = header.split(' ');

    // 5. Log the type and size of the object to the console
    console.log(`Type: ${type}`);   
    console.log(`Size: ${size} bytes`);
    console.log("--------------------------------");

    // 6. If the object is a blob, log the content to the console as a string. If the object is a tree, call the parseTree function to parse and log the entries in the tree
    if (type === 'blob') {
        console.log(content.toString());
    } else if (type === 'tree') {
        parseTree(content);
    } else {
        console.log("Unknown object type");
    }
}
```

- The `inspectObject` function is the main function responsible for:
    - Taking a SHA-1 hash as input, which represents the identifier of a mygit object (either a blob or a tree).
    - It reads the corresponding object file from the `.mygit/objects` directory, decompresses it using zlib, and then calls the `parseObject` function to parse and log the contents of the object to the console.
```javascript
function inspectObject(hash) {
    // 1. Construct the path to the object file in the .mygit/objects directory using the provided hash
    const dir = hash.slice(0, 2); // The first two characters of the hash represent the directory
    const file = hash.slice(2); // The remaining characters of the hash represent the file
    const objPath = path.join(process.cwd(), '.mygit', 'objects', dir, file); // Construct the full path to the object file

    // 2. Read the compressed object file from the .mygit/objects directory
    if (!fs.existsSync(objPath)) {
        console.error(`Object with hash ${hash} not found.`);
        return;
    }
    const compressed = fs.readFileSync(objPath); // Read the compressed object file
    // 3. Decompress the object using zlib's inflateSync method, which returns a buffer containing the decompressed data
    const decompressed = zlib.inflateSync(compressed); // Decompress the object using zlib

    // 4. Call the parseObject function to parse and log the contents of the object to the console
    parseObject(decompressed); // Parse and log the contents of the object
}

// Export the inspectObject function as a module so it can be used in other parts of the application
module.exports = inspectObject;
```