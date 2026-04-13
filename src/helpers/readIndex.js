const fs = require('fs')
const path = require('path')

function readIndex() {
    const indexPath = path.join(process.cwd(), '.mygit', 'index')

    if (!fs.existsSync(indexPath)) {
        return {version: 1, entries: {}}
    }

    try {
        const content = fs.readFileSync(indexPath, 'utf-8')
        return JSON.parse(content)
    } catch (error) {
        console.error('error: unable to read index')
        console.error(error.message)
        process.exit(1)
    }
}

module.exports = readIndex