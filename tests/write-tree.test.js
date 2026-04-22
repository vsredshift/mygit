const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

const writeTree = require('../src/commands/write-tree')
const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const run = require('./helpers/run')
const { hash } = require('node:crypto')

test.beforeEach(setupRepo)
test.afterEach(cleanupRepo)

// HELPERS
function readObject(hash) {
    const objPath = path.join(baseDir, '.mygit', 'objects', hash.slice(0,2), hash.slice(2))

    const compressed = fs.readFileSync(objPath)
    const decompressed = zlib.inflateSync(compressed)

    const nullIndex = decompressed.indexOf(0)

    return {
        header: decompressed.slice(0, nullIndex).toString(),
        content: decompressed.slice(nullIndex + 1)
    }
}

// ______TESTS______

console.log('\nTESTING WRITE-TREE\n')

test('write-tree creates a tree object for a single file', ()=> {
    fs.writeFileSync('hello.txt', 'hello world')

    const hash = writeTree()

    assert.ok(hash)
    assert.strictEqual(hash.length, 40)

    const obj = readObject(hash)

    assert.ok(obj.content.includes(Buffer.from('hello.txt')))
})

test('write-tree includes multiple files', () => {
    fs.writeFileSync('a.txt','A');
    fs.writeFileSync('b.txt','B');

    const hash = writeTree()
    const obj = readObject(hash)

    assert.ok(obj.content.includes(Buffer.from('a.txt')))
    assert.ok(obj.content.includes(Buffer.from('b.txt')))

})

test('write-tree creates subtree for nested directories', ()=> {
    fs.mkdirSync('src')
    fs.writeFileSync('src/app.js', 'console.log("hi)')

    const rootHash = writeTree()
    const rootTree = readObject(rootHash)
    
    assert.ok(rootTree.content.includes(Buffer.from('src')))
})

test('write-tree ignores .mygit directory', () => {
    fs.writeFileSync('tracked.txt', 'tracked')
    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'secret'),
        'ignore me'
    )

    const hash = writeTree()

    const obj = readObject(hash)

    assert.ok(obj.content.includes(Buffer.from('tracked.txt')))
    assert.strictEqual(obj.content.includes(Buffer.from('.mygit')), false)
})

test( 'write-tree is deterministic for same contents', () => {
    fs.writeFileSync('same.txt', 'same content')

    const hash1 = writeTree()
    const hash2 = writeTree()
    assert.strictEqual(hash1, hash2)
})
