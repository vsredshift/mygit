const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const hashObject = require('../src/commands/hash-object');
const {setupRepo, cleanupRepo,baseDir} = require('./helpers/setup')

function setup() {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    fs.mkdirSync(path.join(testDir, '.mygit', 'objects'), { recursive: true });
}

function cleanup() {
    process.chdir(__dirname);
    fs.rmSync(testDir, { recursive: true, force: true });
}

// Run before/after each test
test.beforeEach(setupRepo);
test.afterEach(cleanupRepo);


// 🧪 Test 1: hash is generated correctly
test('hashObject returns a valid SHA-1 hash', () => {
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject(filePath, false);

    assert.strictEqual(hash.length, 40);
    assert.match(hash, /^[a-f0-9]{40}$/);
});


// 🧪 Test 2: write=false does NOT create object
test('hashObject does not write object when write=false', () => {
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject(filePath, false);

    const dir = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const objPath = path.join(baseDir, '.mygit', 'objects', dir, fileName);

    assert.strictEqual(fs.existsSync(objPath), false);
});


// 🧪 Test 3: write=true creates object file
test('hashObject writes compressed object to disk', () => {
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject(filePath, true);

    const dir = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const objPath = path.join(baseDir, '.mygit', 'objects', dir, fileName);

    assert.strictEqual(fs.existsSync(objPath), true);
});


// 🧪 Test 4: object content is correct (REAL test 🔥)
test('stored object has correct blob format', () => {
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello');

    const hash = hashObject(filePath, true);

    const dir = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const objPath = path.join(baseDir, '.mygit', 'objects', dir, fileName);

    const compressed = fs.readFileSync(objPath);
    const decompressed = zlib.inflateSync(compressed);

    const expected = Buffer.from('blob 5\0hello');

    assert.deepStrictEqual(decompressed, expected);
});


// 🧪 Test 5: same content → same hash (important property)
test('same content produces same hash', () => {
    const file1 = path.join(baseDir, 'a.txt');
    const file2 = path.join(baseDir, 'b.txt');

    fs.writeFileSync(file1, 'hello');
    fs.writeFileSync(file2, 'hello');

    const hash1 = hashObject(file1, false);
    const hash2 = hashObject(file2, false);

    assert.strictEqual(hash1, hash2);
});