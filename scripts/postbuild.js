const fs = require('fs')
const path = require('path')

const cwd = process.cwd()
const srcManifest = path.join(cwd, 'dist', 'src', 'assets', 'manifest.json')
const destManifest = path.join(cwd, 'dist', 'manifest.json')
const publicFavicon = path.join(cwd, 'dist', 'public', 'favicon.ico')
const rootFavicon = path.join(cwd, 'dist', 'favicon.ico')

try {
  // Move manifest to dist root and remove nested copy
  if (fs.existsSync(srcManifest)) {
    fs.copyFileSync(srcManifest, destManifest)
    fs.unlinkSync(srcManifest)
    console.log(`Copied manifest to ${destManifest} and removed ${srcManifest}`)
  } else {
    console.warn(`Source manifest not found: ${srcManifest}`)
  }

  // Ensure favicon is at dist root and remove any duplicated copy under dist/public
  if (fs.existsSync(publicFavicon)) {
    fs.copyFileSync(publicFavicon, rootFavicon)
    fs.unlinkSync(publicFavicon)
    console.log(`Moved favicon to ${rootFavicon} and removed ${publicFavicon}`)

    // Remove dist/public directory if empty
    const publicDir = path.join(cwd, 'dist', 'public')
    try {
      const files = fs.readdirSync(publicDir)
      if (files.length === 0) {
        fs.rmdirSync(publicDir)
        console.log(`Removed empty directory ${publicDir}`)
      }
    } catch (e) {
      // ignore
    }
  } else {
    // If no dist/public/favicon.ico, ensure root favicon exists by copying from source public/
    if (!fs.existsSync(rootFavicon)) {
      const originalPublicFavicon = path.join(cwd, 'public', 'favicon.ico')
      if (fs.existsSync(originalPublicFavicon)) {
        fs.copyFileSync(originalPublicFavicon, rootFavicon)
        console.log(`Copied original public/favicon.ico to ${rootFavicon}`)
      } else {
        console.warn('Favicon not found in dist/public or public/')
      }
    } else {
      console.log('Root favicon already exists')
    }
  }
} catch (err) {
  console.error('Failed to postbuild cleanup:', err)
  process.exit(1)
}
