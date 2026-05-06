/* eslint-disable no-console */
const { chromium } = require('playwright')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3011'
const FREEZE_THRESHOLD_MS = 10000
const ITERATIONS = Number(process.env.E2E_ITERATIONS || 8)
const MODE = process.env.E2E_MODE || 'preview'

async function ensureAtLeastTwoNotes(page) {
  const itemSelector = '.noteListItem .noteListItem-text'
  await page.waitForSelector(itemSelector, { timeout: 30000 })
  let count = await page.locator(itemSelector).count()
  while (count < 2) {
    await page.locator('.newNote').click()
    await page.waitForTimeout(200)
    count = await page.locator(itemSelector).count()
  }
}

async function setHeavyMarkdown(page) {
  await page.waitForFunction(() => {
    const editorRoot = document.querySelector('.editor')
    const vueCtx = editorRoot && editorRoot.__vueParentComponent && editorRoot.__vueParentComponent.ctx
    const viaVue = Boolean(vueCtx && vueCtx.editor && typeof vueCtx.editor.setValue === 'function')
    const viaGlobal = Boolean(window.monaco && window.monaco.editor)
    return viaVue || viaGlobal
  }, { timeout: 30000 })

  const result = await page.evaluate(() => {
    const section = [
      '# Header',
      '',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      '',
      '- item A',
      '- item B',
      '- item C',
      '',
      '```js',
      'const n = 42',
      'console.log(n)',
      '```',
      '',
      '| h1 | h2 |',
      '|---|---|',
      '| a | b |',
      ''
    ].join('\n')
    const content = Array.from({ length: 1400 }, () => section).join('\n')

    const editorRoot = document.querySelector('.editor')
    const vueCtx = editorRoot && editorRoot.__vueParentComponent && editorRoot.__vueParentComponent.ctx
    const editor = vueCtx && vueCtx.editor
    if (editor && typeof editor.setValue === 'function' && typeof editor.getModel === 'function') {
      editor.setValue(content)
      const model = editor.getModel()
      return { ok: true, lines: model && typeof model.getLineCount === 'function' ? model.getLineCount() : 0, route: 'vue-editor' }
    }

    if (window.monaco && window.monaco.editor) {
      const model = window.monaco.editor.getModels()[0]
      if (model) {
        model.setValue(content)
        return { ok: true, lines: model.getLineCount(), route: 'global-model' }
      }
    }

    return { ok: false, reason: 'editor instance not found' }
  })

  if (!result.ok) {
    throw new Error(`failed to set markdown: ${result.reason}`)
  }
}

async function switchToDualPane(page) {
  const modeButtons = page.locator('.contents-wrapper > .footer button')
  await modeButtons.nth(1).click()
  await page.waitForSelector('#child-frame', { timeout: 30000 })
}

async function switchNoteAndMeasure(page, index) {
  const note = page.locator('.noteListItem .noteListItem-text').nth(index)
  const t0 = Date.now()
  await note.click()
  await page.waitForFunction((i) => {
    const items = Array.from(document.querySelectorAll('.noteListItem'))
    return Boolean(items[i] && items[i].classList.contains('active'))
  }, index, { timeout: 20000 })
  return Date.now() - t0
}

async function withTimeout(promiseFactory, timeoutMs, label) {
  let timer = null
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })
    return await Promise.race([promiseFactory(), timeoutPromise])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

async function stressScrollPreview(page) {
  const iframeHandle = await page.$('#child-frame')
  if (!iframeHandle) {
    throw new Error('preview iframe not found')
  }
  const frame = await iframeHandle.contentFrame()
  if (!frame) {
    throw new Error('preview frame context not ready')
  }

  await frame.evaluate(() => {
    const root = document.documentElement
    const max = Math.max(0, root.scrollHeight - root.clientHeight)
    const target = Math.floor(max * 0.75)
    window.scrollTo(0, target)
  })

  for (let i = 0; i < 80; i += 1) {
    await frame.evaluate(() => {
      window.scrollBy(0, 220)
      window.scrollBy(0, -120)
    })
  }
}

async function stressScrollEditor(page) {
  const editor = page.locator('.monaco-editor').first()
  await editor.waitFor({ state: 'visible', timeout: 30000 })
  await editor.hover()
  for (let i = 0; i < 120; i += 1) {
    await page.mouse.wheel(0, 320)
  }
}

async function run() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  })

  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } })
  page.setDefaultTimeout(20000)
  page.setDefaultNavigationTimeout(60000)
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[page error] ${msg.text()}`)
    }
  })

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForSelector('#app', { timeout: 30000 })
    await page.waitForSelector('.monaco-editor', { timeout: 30000 })

    await ensureAtLeastTwoNotes(page)
    await switchToDualPane(page)
    await setHeavyMarkdown(page)
    await page.waitForTimeout(1200)

    // baseline: note switch must be possible first
    const baselineForward = await switchNoteAndMeasure(page, 1)
    const baselineBack = await switchNoteAndMeasure(page, 0)
    console.log(`[baseline] forward=${baselineForward}ms back=${baselineBack}ms`)

    const durations = []
    for (let i = 0; i < ITERATIONS; i += 1) {
      console.log(`[iteration ${i + 1}] start`) 
      const stressLabel = MODE === 'editor' ? 'editor' : 'preview'
      await withTimeout(
        () => (MODE === 'editor' ? stressScrollEditor(page) : stressScrollPreview(page)),
        20000,
        `${stressLabel} scroll stress at iteration ${i + 1}`
      )
      console.log(`[iteration ${i + 1}] ${stressLabel} scrolled`) 
      const elapsed = await withTimeout(
        () => switchNoteAndMeasure(page, 1),
        20000,
        `switch after preview scroll at iteration ${i + 1}`
      )
      durations.push(elapsed)
      console.log(`[iteration ${i + 1}] second-switch=${elapsed}ms`)
      await withTimeout(
        () => switchNoteAndMeasure(page, 0),
        20000,
        `switch back at iteration ${i + 1}`
      )
      await page.waitForTimeout(120)
    }

    const max = Math.max(...durations)
    const min = Math.min(...durations)
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    const freezeCount = durations.filter((v) => v >= FREEZE_THRESHOLD_MS).length
    const freezeRatio = (freezeCount / durations.length) * 100

    console.log(`[summary][mode=${MODE}] min=${min}ms max=${max}ms avg=${avg}ms freeze(>=${FREEZE_THRESHOLD_MS})=${freezeCount}/${durations.length} (${freezeRatio.toFixed(1)}%)`)

    if (freezeCount === 0) {
      console.log('[result] freeze was not reproduced with current stress profile.')
      process.exitCode = 2
      return
    }

    if (freezeRatio < 80) {
      console.log('[result] freeze reproduced but not stable enough (<80%).')
      process.exitCode = 3
      return
    }

    console.log('[result] freeze reproduced stably.')
  } finally {
    await page.close()
    await browser.close()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
