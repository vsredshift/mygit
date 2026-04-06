# The `checkout` command
> The `checkout` command is used to switch between branches in a mygit repo and also to create and switch to new branches.

## What it does 
- Validates the branch exists
- Updates the HEAD file to point to the new branch
- Reads the commit that the branch points to
- Reads the tree from that commit
- Updates the working directory to match the tree(creates, deletes or updates files as necessary)
- if you run `mygit checkout -b <branch>` it also creates a new branch

## implementation explained 
The `checkout` command is implemented in the the `src/commands/checkout.js` file. It takes an array of arguments as input and performs the appropriate action based on the first argument.

For this implementation we are also importing some helper functions from other files.
- `getCurrentBranch()` - Returns the name of the current branch, or null if HEAD is not a symbolic reference.
- `readObject()` - Reads the commit object and returns the header and the content of the commit object.
- `parseTree()` - Parses the tree object and returns an array of objects containing the mode, name, and hash of each entry.

There are several functions in this file.
- `readTree()` - Reads a tree object and returns an object containing the hash and the mode of each entry (file or directory).
- `getCurrentFiles()` - Returns a set of all the files relative paths in the current working directory.
- `updateWorkingDirectory()` - Updates the working directory to match the tree.
- `checkout()` - The main function that handles the `checkout` command.

## Implementation of each function

- The imports:
```javascript
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const getCurrentBranch = require('../helpers/getCurrentBranch')
const readObject = require('../helpers/readObject')
const parseTree = require('../helpers/parseTree')
```
- The `readTree()` function is a helper function responsible for:
    - Reading the contents of the tree onject. It takes a tree hash as an argument and uses the `readObject` function to read the object.
    - Parsing the content of the tree object and returning an object of file and directory entries, where each entry has hash, and mode. 
```javascript
function readTree(treeHash, prefix) {
    const { content } = readObject(treeHash)
    const entries = parseTree(content)
    const files = {} 

    for (const entry of entries) {
        const fullPath = prefix ? path.join(prefix, entry.name) : entry.name

        if (entry.mode === '40000') {
            const subFiles = readTree(entry.hash, fullPath)
            Object.assign(files, subFiles)
        } else {
            files[fullPath] = { hash: entry.hash, mode: entry.mode }
        }
    }

    return files
}
```

- The `getCurrentFiles()` function is a helper function responsible for:
    - Reading the contents of the current working directory.
    - Returning a set of all the files relative paths in the current working directory.
```javascript
function getCurrentFiles(dir=process.cwd(), prefix="") {
    const files = new Set()
    
    if (!fs.existsSync(dir)) {
        return files
    }

    const entries = fs.readdirSync(dir)

    for (const entry of entries) {
        if (entry === '.mygit') continue

        const fullPath = path.join(dir, entry)
        const relativePath = prefix ? path.join(prefix, entry) : entry
        const stats = fs.statSync(fullPath)

        if (stats.isDirectory()) {
            const subfiles = getCurrentFiles(fullPath, relativePath)
            subfiles.forEach(f => files.add(f))
        } else if (stats.isFile()) {
            files.add(relativePath)
        }
    }

    return files 
}
```
- The `updateWorkingDirectory()` function is a helper function responsible for:
    - It takes an object containing the hash and the mode of each entry (file or directory) as an argument. This are the target files to be updated in the working directory.
    - It iterates over the entries and updates the working directory accordingly.
```js
function updateWorkingDirectory(targetFiles) {
    const repoRoot = process.cwd()
    const currentFiles = getCurrentFiles()

    // Delete files that should not exist in this branch
    for (const filePath of currentFiles) {
        if(!targetFiles[filePath]) {
            const fullPath = path.join(repoRoot, filePath)
            fs.unlinkSync(fullPath)

            let dir = path.dirname(fullPath)
            while (dir !== repoRoot) {
                try {
                    if (fs.readdirSync(dir).length === 0) {
                        fs.rmdirSync(dir)
                        dir = path.dirname(dir)
                    } else {
                        break
                    }
                } catch (error) {
                    break
                }
            }
        }
    }

    // Create/update files from target 
    for (const [filePath, fileInfo] of Object.entries(targetFiles)) {
        const fullPath = path.join(rootRepo, filePath)
        const { content } = readObject(fileInfo.hash)

        const dir = path.dirname(fullPath)

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(fullPath, content)

        if (fileInfo.mode === "100755") {
            fs.chmodSync(fullPath, 0o755)
        }
    }
}
```
- The `checkout()` function is the main function that handles the `checkout` command. It takes an array of arguments as input and performs the appropriate task based on the first argument.

```javascript
function checkout(args) {
    // 1. Check if you are in a mygit repo
    const mygitDir = path.join(process.cwd(), '.mygit')

    if (!fs.existsSync(mygitDir)) {
        console.error('fatal: not a mygit repository')
        process.exit(1)
    }

    // 2. Parse Arguments

    let createBranch = false
    let branchName = null

    if (args.length === 0) {
        console.error('error: branch name required');
        console.error('Usage: mygit checkout [-b] <branch>');
        process.exit(1);
    }

    if (args[0] === '-b') {
        // Create and checkout branch
        createBranch = true
        branchName = args[1]

        if (!branchName) {
            console.error('error: branch name required after -b');
            process.exit(1);
        }
    } else {
        // just checkout existing branch
        branchName = args[0]
    }

    // Validate branch name

    if (!/^[a-zA-Z0-9_\-\/]+$/.test(branchName)) {
        console.error(`fatal: '${branchName}' is not a valid branch name.`);
        process.exit(1);
    }

    // 3. Handle -b flag (create and checkout)
    const branchPath = path.join(mygitDir, 'refs', 'heads', branchName)

    if (createBranch) {
        if (fs.existsSync(branchPath)) {
            console.error(`fatal: A branch named '${branchName}' already exists.`);
            process.exit(1);
        }

        // Get current Commit
        const headPath = path.join(mygitDir, 'HEAD')
        const headContent = fs.readFileSync(headPath, 'utf-8').trim()

        let currentCommit = null

        if (headContent.startsWith('ref: ')) {
            const currentBranchRef = headContent.substring(5)
            const currentBranchPath = path.join(mygitDir, currentBranchRef)

            if (fs.existsSync(currentBranchPath)) {
                currentCommit = fs.readFileSync(currentBranchPath, 'uft-8').trim()
            }
        } 

        if (!currentCommit) {
            console.error('fatal: You are on a branch yet to be born')
            process.exit(1)
        }

        // Create the new Branch
        const branchDir = path.dirname(branchPath)
        fs.mkdirSync(branchDir, {recursive: true})
        fs.writeFileSync(branchPath, currentCommit + '\n')
    }

    // 4. Validate branch exists
    if (!fs.existsSync(branchPath)) {
        console.error(`error: pathspec '${branchName}' did not match any file(s) known to mygit.`);
        process.exit(1);
    }

    // 5. Check if already on this branch
    const currentBranch = getCurrentBranch()

    if (currentBranch === branchName) {
        console.log(`Already on '${branchName}'`);
        return;
    }

    // 6. Get the commit that the branch points to 
    const commitHash = fs.readFileSync(branchPath, 'uft-8').trim()

    if (!commitHash) {
        console.error(`fatal: reference is not a tree: ${branchName}`);
        process.exit(1);
    }

    // 7. Read the Commit object
    let treeHash

    try {
        const { header, content } = readObject(commitHash)

        if (!header.startsWith('commit ')) {
            console.error(`fatal: reference is not a commit: ${branchName}`);
            process.exit(1);
        }

        // Parse the commit to get tree hash
        const lines = content.toString().split('\n')

        for (const line of lines) {
            if (line.startsWith('tree ')) {
                treeHash = line.substring(5)
                break
            }
        }

        if (!treeHash) {
            console.error('fatal: invalid commit object');
            process.exit(1);
        }
    } catch (error) {
        console.error(`fatal: unable to read commit ${commitHash}`);
        console.error(error.message);
        process.exit(1);
    }

    // 8. Read the tree and get the target files
    let targetFiles
    try {
        targetFiles = readTree(treeHash)
    } catch (error) {
        console.error(`fatal: unable to read tree ${treeHash}`);
        console.error(error.message);
        process.exit(1);
    }

    // --9. Update working dir
    try {
        updateWorkingDirectory(targetFiles);
    } catch (error) {
        console.error('error: unable to update working directory');
        console.error(error.message);
        process.exit(1);
    }

    // 10. update HEAD to point to new Branch
    const headPath = path.join(mygitDir, 'HEAD')
    fs.writeFileSync(headPath, `ref: refs/heads/${branchName}\n`)

    // 11. Print success message for feedback

    if (createBranch) {
        console.log(`Switched to a new branch '${branchName}'`);
    } else {
        console.log(`Switched to branch '${branchName}'`);
    }
}

module.exports = checkout 
```