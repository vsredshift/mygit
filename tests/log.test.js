const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const zlib = require('zlib')
const crypto = require('crypto')

const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const logCmd = require('../src/commands/log')

test.beforeEach(() => {
    setupRepo()

    fs.mkdirSync(
        path.join(baseDir,'.mygit','refs','heads'),
        { recursive:true }
    );

    fs.writeFileSync(
        path.join(baseDir,'.mygit','HEAD'),
        'ref: refs/heads/main'
    );
})
test.afterEach(cleanupRepo)

// HELPERS

function writeCommit(content) {
    const body = Buffer.from(content)
    const header = Buffer.from(`commit ${body.length}\0`)

    const store = Buffer.concat([header, body])
    const hash = crypto.createHash('sha1').update(store).digest('hex')

    const dir = path.join(baseDir, '.mygit', 'objects', hash.slice(0,2))

    fs.mkdirSync(dir, {recursive: true})

    fs.writeFileSync(path.join(dir, hash.slice(2)), zlib.deflateSync(store))

    return hash
}

function captureLog(fn) {
    const original = console.log
    let output = []

    console.log = (...args) => {
        output.push(args.join(' '))
    }

    try {
        fn()
    } finally {
        console.log =  original
    }

    return output.join('\n')
}

// ______TESTS______

console.log('\nTESTING LOG\n')

test('log shows "No commits yet" in empty repo', () => {
    const output = captureLog(() => {
        logCmd()
    })

    assert.match(output, /No commits yet/)
})

test('log shows a single commit', () => {
    const hash = writeCommit(
`tree abc123
author Leonardo <leo@test.com> 1710000000 +0000
committer Leonardo <leo@test.com> 1710000000 +0000

Initial commit`
    )

    const commitPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'main')
    fs.writeFileSync(commitPath, hash)

    const output = captureLog(() => {
        logCmd()
    })

    assert.match(output, /Initial commit/)
    assert.match(output, RegExp(hash))
})

test('log follows parent chain for multiple commits', () => {
    const first = writeCommit(
`tree aaa111
author Leo <a@b.com> 1710000000 +0000
committer Leo <a@b.com> 1710000000 +0000

First commit`
    );


    const second = writeCommit(
`tree bbb222
parent ${first}
author Leo <a@b.com> 1710000100 +0000
committer Leo <a@b.com> 1710000100 +0000

Second commit`
    );
    const secondCommitPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'main')

    fs.writeFileSync(secondCommitPath, second)

    const output = captureLog(() => {
        logCmd()
    })

    assert.match(output, /Second commit/)
    assert.match(output, /First commit/)

    assert.ok(
        output.indexOf('Second commit') < output.indexOf('First commit')
    )
})

test('log oneline shows short format', () => {
    const hash = writeCommit(
`tree abc123
author Leo <a@b.com> 1710000000 +0000
committer Leo <a@b.com> 1710000000 +0000

One line test`
    );

    const commitPath = path.join(baseDir, '.mygit', 'refs', 'heads', 'main')
    fs.writeFileSync(commitPath, hash)

    const output = captureLog(() => {
        logCmd({oneline: true})
    })

    assert.match(output, new RegExp(hash.slice(0, 7)))
    assert.match(output, /One line test/)
})

test('log exits when HEAD is missing', () => {

    fs.unlinkSync(
        path.join(baseDir,'.mygit','HEAD')
    );

    const originalExit = process.exit;

    let exitCode;

    process.exit = (code) => {
        exitCode = code;
        throw new Error('EXIT');
    };

    assert.throws(
        () => logCmd(),
        /EXIT/
    );

    assert.strictEqual(
        exitCode,
        1
    );

    process.exit = originalExit;

});