const fs = require('fs')
const path = require('path')

function mygitInit(targetDir=process.cwd()) {
    const mygitDir = path.join(targetDir, ".mygit")
    const objectsDir = path.join(mygitDir, "objects")
    const refsDir = path.join(mygitDir, "refs")
    const headsDir = path.join(refsDir, 'heads')
    const headFile = path.join(mygitDir, 'HEAD')

    if (fs.existsSync(mygitDir)) {
        console.log("A '.mygit' directory already exist inside this folder.")
        return
    }

    fs.mkdirSync(mygitDir, {recursive: true})
    fs.mkdirSync(objectsDir, {recursive: true})
    fs.mkdirSync(refsDir, {recursive: true})
    fs.mkdirSync(headsDir, {recursive: true})

    fs.writeFileSync(headFile, 'ref: refs/heads/main\n')

    console.log(`Initialized empty mygit repository in ${mygitDir}`)

}

module.exports = mygitInit