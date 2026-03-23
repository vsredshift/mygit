# The `cat-file` command
> The `cat-file` command is used to inspect the content of a Git object. It can be used to view the contents of a blob, tree, or commit object.

## What it does 
- The `cat-file` function reads the hash of a Git object. 
- It then reads the object from the .mygit/objects. 
- It decompresses the object and parses it to extract the type, size, and content of the object.
- It then formats the output, based on the flags passed to the command. The output is formatted to be human-readable and easy to understand.

## Implementation explained
- The `cat-file` command is implemented in the `cat-file.js` file in the `src/commands` directory. There are five functions in this file.
    - `readObject(hash)` helper function.
    - `parseTree(content)` helper function.
    - `prettyPrint(type, content)` helper function.
    - `findObjectByPrefix(prefix)` helper function.
    - `catFile(mode, hash)` main function.

## Implementation of each function
- The `readObject` function is a helper responsible for:
    - Reading the object from the .mygit/objects directory, based on the provided hash.
    - Decompressing the object using zlib.
    - Parsing the object to extract its type, size, and content.
```javascript
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function readObject(hash) {
    // 1. read the object
    const dir = hash.slice(0,2)
    const file = hash.slice(2)
    const objPath = path.join(process.cwd(), '.mygit', 'objects', dir, file)

    if (!fs.existSync(objPath)) {
        console.error(`fatal: Not a valid object name ${hash}`)
        process.exit(1)
    }

    // 2. Decompressed the contents of the file
    const compressed = fs.readFileSync(objPath)
    const decompressed = zlib.inflateSync(compressed)

    // 3. Split at the null byte to separate header from content
    const nullIndex = decompressed.indexOf(0)
    const header = decompressed.slice(0, nullIndex).toString() // now it is a readable string
    const content = decompressed.slice(nullIndex + 1) //content should remain a buffer

    // 3. Parse header ('blob 12' or 'tree 143' or 'commit 345')
    const spaceIndex = header.indexOf(' ')
    const type = header.slice(0, spaceIndex)
    const size = parseInt(header.slice(spaceIndex + 1))

    // 4. Return an object
    return {type, size, content}
}
```

- The `parseTree` function is a helper responsible for:
    - Parsing the content of a tree object to extract its entries.
```javascript
fucntion parseTree(content) {
    // tree format = <mode> <name>\0<20-byte-hash>

    const entries = [] // To keep track of the contents of the tree
    let offset = 0 // To keep track of the current position in the buffer

    while (offset < content.length) {
        // 1. find the null byte after the name
        let nullPos = offset
        while (content[nullPos] !== 0) nullPos++

        // 2. extract the mode and name
        const entry = content.slice(offset, nullPos).toString()
        const [mode, name] = entry.split(' ')

        // 3. extract the 20-byte hash and convert it to hex
        const hashBytes = content.slice(nullPos + 1, nullPos + 21)
        const hash = hashBytes.toString('hex')

        // 4. Derermine type from mode
        let type

        if (mode === '40000') {
            type = 'tree'
        } else if (mode === '160000') {
            type = 'commit'
        } else {
            type = 'blob'
        }

        // 5. Add the entry to the entries array
        entries.push({name, hash, type, mode})
    }

    // 6. Return the entries array
    return entries
}
```

- The `prettyPrint` function is a helper responsible for:
    - Formatting the output, based on the flags passed to the command.
    - It takes two arguments: the type of the object and the content of the object.
```javascript
function prettyPrint(type, content) {
    if (type === 'blob') {
        process.stdout.write(content) // write the content to stdout making it human-readable, it converts the buffer to a string
    } else if (type === 'tree') {
        const entries = parseTree(content)

        for (const entry of entries) {
            // Format: <mode> <type> <hash>\t<name>
            // Git uses tabs between hash and name
            console.log(`${entry.mode.padStart(6, '0')} ${entry.type} ${entry.hash}\t${entry.name}`)
        }
    } else if (type === 'commit') {
        // For commits, just display as text
        console.log(content.toString())
    } else {
        console.log(content.toString())
    }
}
```

- The `findObjectByPrefix` function is a helper responsible for:
    - Finding the object by the short hash version
    - It takes one argument: the short hash version.
    - It return the full hash version if it is found, otherwise it returns null.
```javascript
function findObjectByPrefix(prefix) {
    // 1. Search in the dir corresponfing to the first two chars of the prefix
    const dir = prefix.slice(0, 2)
    const objectsDir = path.join(process.cwd(), '.mygit', 'objects', dir)

    if (!fs.existsSync(objectsDir)) {
        return null
    }

    // 2. Get the list of files in the directory
    const files = fs.readdirSync(objectsDir)
    const suffix = prefix.slice(2)

    // 3. Find files that start with the remaining prefix
    const matches = files.filter(file => file.startsWith(suffix))

    if (matches.length === 0) {
        return null
    }

    // If there are multiple matches, print an error message
    if (matches.length > 1) {
        console.error(`error: short SHA1 ${prefix} is ambiguous`);
        console.error('The candidates are:');
        for (const match of matches) {
            const fullHash = dir + match;
            const { type } = readObject(fullHash);
            console.error(`  ${fullHash} ${type}`);
        }
        process.exit(1);
    }

    // 4. Return the full hash version
    return dir + matches[0]
}
```

- The `catFile` function is the main function responsible for:
    - It takes two arguments: the mode (how to display the object) and the hash of the object.
    - It calls the `readObject` function to read the object from the .mygit/objects directory.
    - It handles the flags passed to the command and calls the `prettyPrint` function to format the output.
```javascript
function catFile(flag, hash) {
    // 1. Validate inputs
    if (!flag || !hash) {
        console.error('Usage: mygit cat-file -p|-s|-t <hash-object>')
        process.exit(1)
    }

    // Validate hash format (should be 40 hex characters or a prefix at least 4 chars long)
    if (!/^[0-9a-f]{4,40}$/i.test(hash)) {
        console.error(`fatal: Not a valid object name ${hash}`)
        process.exit(1)
    }

    // If hash is less than 40 chars, it's a prefix - we need to find the full hash
    let fullHash = hash

    if (hash.length < 40) {
        fullHash = findObjectByPrefix(hash)
        if (!fullHash) {
            console.error(`fatal: Not a valid object name ${hash}`)
            process.exit(1)
        }
    }

    // 2. Read the object from the .mygit/objects directory
    const { type, size, content } = readObject(fullHash)

    // 3. Handle different flags
    switch (flag) {
        case '-t':
            console.log(type)
            break
        case '-s':
            console.log(size)
            break
        case '-p':
            prettyPrint(type, content)
            break    
        default:
            console.error(`Unknown mode: ${flags}`)
            console.error('Usage: mygit cat-file [-t | -s | -p] <object>');
            process.exit(1);
    }
}
```