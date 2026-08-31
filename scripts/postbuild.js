const fs = require('fs')
const path = require('path')

const cwd = process.cwd()
const distDir = path.join(cwd, 'dist')

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function copyAndRemove(srcPath, destPath, label) {
  if (!fs.existsSync(srcPath)) {
    return false
  }
  ensureDir(path.dirname(destPath))
  fs.copyFileSync(srcPath, destPath)
  fs.unlinkSync(srcPath)
  console.log(`${label}: copied to ${destPath} and removed ${srcPath}`)
  return true
}

function removeDirIfExists(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
    console.log(`Removed directory ${dirPath}`)
  }
}

function ensureRootFileFromSource(sourcePath, destPath, label) {
  if (fs.existsSync(destPath)) {
    return
  }
  if (fs.existsSync(sourcePath)) {
    ensureDir(path.dirname(destPath))
    fs.copyFileSync(sourcePath, destPath)
    console.log(`${label}: copied from source ${sourcePath} to ${destPath}`)
  }
}

try {
  // manifest.json -> dist/manifest.json
  copyAndRemove(
    path.join(distDir, 'src', 'assets', 'manifest.json'),
    path.join(distDir, 'manifest.json'),
    'manifest'
  )

  // _locales/*/messages.json -> dist/_locales/*/messages.json
  copyAndRemove(
    path.join(distDir, '_locales', 'en', 'src', 'assets', '_locales', 'en', 'messages.json'),
    path.join(distDir, '_locales', 'en', 'messages.json'),
    'locale en'
  )
  copyAndRemove(
    path.join(distDir, '_locales', 'ja', 'src', 'assets', '_locales', 'ja', 'messages.json'),
    path.join(distDir, '_locales', 'ja', 'messages.json'),
    'locale ja'
  )

  // icons/*.png -> dist/icons/*.png
  copyAndRemove(
    path.join(distDir, 'icons', 'src', 'assets', 'icons', 'icon_32.png'),
    path.join(distDir, 'icons', 'icon_32.png'),
    'icon 32'
  )
  copyAndRemove(
    path.join(distDir, 'icons', 'src', 'assets', 'icons', 'icon_42.png'),
    path.join(distDir, 'icons', 'icon_42.png'),
    'icon 42'
  )
  copyAndRemove(
    path.join(distDir, 'icons', 'src', 'assets', 'icons', 'icon_128.png'),
    path.join(distDir, 'icons', 'icon_128.png'),
    'icon 128'
  )

  // css/github-markdown-css.css -> dist/css/github-markdown-css.css
  copyAndRemove(
    path.join(distDir, 'css', 'src', 'css', 'github-markdown-css.css'),
    path.join(distDir, 'css', 'github-markdown-css.css'),
    'css'
  )

  // favicon.ico -> dist/favicon.ico
  if (!copyAndRemove(path.join(distDir, 'public', 'favicon.ico'), path.join(distDir, 'favicon.ico'), 'favicon')) {
    ensureRootFileFromSource(
      path.join(cwd, 'public', 'favicon.ico'),
      path.join(distDir, 'favicon.ico'),
      'favicon'
    )
  }

  // remove now-unnecessary nested folders
  removeDirIfExists(path.join(distDir, 'src'))
  removeDirIfExists(path.join(distDir, 'public'))
  removeDirIfExists(path.join(distDir, 'icons', 'src'))
  removeDirIfExists(path.join(distDir, 'css', 'src'))
  removeDirIfExists(path.join(distDir, '_locales', 'en', 'src'))
  removeDirIfExists(path.join(distDir, '_locales', 'ja', 'src'))
  removeDirIfExists(path.join(distDir, '_metadata'))
} catch (err) {
  console.error('Failed to postbuild cleanup:', err)
  process.exit(1)
}