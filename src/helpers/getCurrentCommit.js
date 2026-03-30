const fs = require('fs')
const path = require('path')

/**
 * Returns the hash of the current commit, or null if HEAD is not a symbolic reference.
 * Reads the HEAD file to determine the current branch and find latest commit hash.
 * If HEAD is a symbolic reference, reads the branch reference to get the latest commit hash.
 * @returns {string|null} The hash of the current commit, or null if HEAD is not a symbolic reference.
 */
function getCurrentCommit() {
    const mygitDir = path.join(process.cwd(), '.mygit')
    const headPath = path.join(mygitDir, 'HEAD')

    if (!fs.existsSync(headPath)) {
        return null
    }

    const headContent = fs.readFileSync(headPath, 'utf-8').trim()

    if (headContent.startsWith('ref: ')) {
        const branchRef = headContent.substring(5)
        const branchPath = path.join(mygitDir, branchRef)

        if (!fs.existsSync(branchPath)) {
            return null
        }

        return fs.readFileSync(branchPath, 'utf8').trim()
    }

    return headContent
}

module.exports = getCurrentCommit