const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

function hashObjectContent(content, type='blob') {
    // Hash and store content as a blob

    const header = `${type} ${content.length}\0`
    const store = Buffer.concat([Buffer.from(header), content])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    // Compress and store

    const compressed = zlib.deflateSync(store)

    const dir = hash.slice(0, 2)
    const filename = hash.slice(2)
    const objectsDir = path.join(process.cwd(), '.mygit', 'objects')
    const objDir = path.join(objectsDir, dir)
    const objPath = path.join(objDir, filename)

    fs.mkdirSync(objDir, {recursive: true})

    if (!fs.existsSync(objPath)) {
        fs.writeFileSync(objPath, compressed)
    }

    return hash
}

module.exports = hashObjectContent