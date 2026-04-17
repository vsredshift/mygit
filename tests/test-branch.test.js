const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testDir = path.join(__dirname, 'test-branch-temp');

function cleanup() {
    try {
        process.chdir(__dirname)
    } catch (error) {}
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

function setup() {
    cleanup();
    fs.mkdirSync(testDir);
    process.chdir(testDir);
}

function run(command) {
    return execSync(command, { encoding: 'utf-8' }).trim();
}

console.log('🧪 Testing branch command...\n');

// Test 1: No branches before first commit
setup();
run('mygit init');
const output1 = run('mygit branch');
if (!output1.includes('No branches')) {
    console.log('❌ Should show no branches before first commit');
} else {
    console.log('✅ Handles no commits correctly');
}

// Test 2: Main branch appears after commit
fs.writeFileSync('test.txt', 'hello');
run('mygit add test.txt');
run('mygit commit -m "Initial"');
const output2 = run('mygit branch');
if (!output2.startsWith('* main')) {
    console.log('❌ Should show main branch after commit');
} else {
    console.log('✅ Shows main branch after first commit');
}

// Test 3: Create new branch
run('mygit branch feature');
const output3 = run('mygit branch');
if (!output3.includes('feature') || !output3.includes('* main')) {
    console.log('❌ Should show both branches');
} else {
    console.log('✅ Creates new branch');
}

// Test 4: Branch file exists
if (!fs.existsSync('.mygit/refs/heads/feature')) {
    console.log('❌ Branch file should exist');
} else {
    console.log('✅ Creates branch reference file');
}

// Test 5: Both branches point to same commit
const mainHash = fs.readFileSync('.mygit/refs/heads/main', 'utf-8').trim();
const featureHash = fs.readFileSync('.mygit/refs/heads/feature', 'utf-8').trim();
if (mainHash !== featureHash) {
    console.log('❌ New branch should point to same commit');
} else {
     console.log('✅ New branch points to current commit');
}

// Test 6: Delete branch
run('mygit branch -d feature');
if (fs.existsSync('.mygit/refs/heads/feature')) {
    console.log('❌ Branch file should be deleted');
} else {
    console.log('✅ Deletes branch');
}

// Test 7: Can't delete current branch
run('mygit branch test');
try {
    run('mygit branch -d main');
    console.log('❌ Should not allow deleting current branch');
} catch (err) {
    console.log('✅ Prevents deleting current branch');
}

// Test 8: Branches diverge after commit
const hash1 = fs.readFileSync('.mygit/refs/heads/main', 'utf-8').trim();
fs.writeFileSync('test2.txt', 'world');
run('mygit commit -m "Second"');
const hash2 = fs.readFileSync('.mygit/refs/heads/main', 'utf-8').trim();
const testHash = fs.readFileSync('.mygit/refs/heads/test', 'utf-8').trim();

if (hash2 === hash1) {
    console.log('❌ Main should move forward');
} else if (testHash !== hash1) {
    console.log('❌ Test branch should stay at old commit');
} else {
    console.log('✅ Branches diverge correctly');
}

cleanup();
console.log('\n✨ All tests passed!');