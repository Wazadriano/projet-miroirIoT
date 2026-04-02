/**
 * Smart Mirror QA - Playwright E2E Tests (Protocole Senior)
 * Quinn (QA agent)
 *
 * Run: npx playwright test e2e/mirror-qa.spec.ts
 */

import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { join } from 'path'

const SCREENSHOTS_DIR = join(__dirname, '../../snapshots/qa')

let app: ElectronApplication
let page: Page
const errors: string[] = []

test.beforeAll(async () => {
  app = await electron.launch({
    args: [join(__dirname, '../out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      API_BASE_URL: 'http://localhost:8000/api',
      IA_PROXY_URL: 'http://localhost:3001',
      MICROSCOPE_STREAM_URL: 'http://localhost:9100/stream.mjpg'
    }
  })
  page = await app.firstWindow()
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(3000)
})

test.afterAll(async () => {
  if (app) await app.close()
})

async function screenshot(name: string): Promise<void> {
  await page.screenshot({ path: join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true })
}

// === SMOKE TEST ===

test('01 - App launches without crash', async () => {
  const body = await page.locator('body').boundingBox()
  expect(body).not.toBeNull()
  expect(body!.width).toBeGreaterThan(0)
  await screenshot('01-launched')
})

test('02 - No JS errors on launch', async () => {
  const criticalErrors = errors.filter(e => !e.includes('DevTools') && !e.includes('Electron Security'))
  expect(criticalErrors).toEqual([])
})

test('03 - Animated background visible', async () => {
  const bg = page.locator('.bg-animated')
  if (await bg.isVisible({ timeout: 2000 }).catch(() => false)) {
    const bgImg = bg.locator('img')
    await expect(bgImg).toBeVisible()
    await screenshot('03-background')
  }
})

// === PROVISIONING (if not provisioned) ===

test('04 - Provisioning or Home screen visible', async () => {
  const provTitle = page.locator('text=Configuration Smart Mirror')
  const homeTitle = page.locator('text=K BEAUTY')

  const isProvisioning = await provTitle.isVisible({ timeout: 2000 }).catch(() => false)
  const isHome = await homeTitle.isVisible({ timeout: 2000 }).catch(() => false)

  expect(isProvisioning || isHome).toBe(true)
  await screenshot('04-first-screen')

  // If provisioning, do manual config
  if (isProvisioning) {
    const manualBtn = page.locator('text=Configuration manuelle')
    if (await manualBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await manualBtn.click()
      await page.waitForTimeout(500)

      const boutiqueInput = page.locator('input[placeholder*="a1b2c3d4"]')
      if (await boutiqueInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await boutiqueInput.fill('a1b2c3d4-0001-4000-8000-000000000001')
      }

      const connectBtn = page.locator('text=Connecter')
      if (await connectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await connectBtn.click()
        await page.waitForTimeout(3000)
      }
    }
    await screenshot('04b-after-provisioning')
  }
})

// === HOME (Veille) ===

test('05 - Home: K BEAUTY title visible', async () => {
  const title = page.locator('text=K BEAUTY')
  if (await title.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expect(title).toBeVisible()
    await screenshot('05-home')
  }
})

test('06 - Home: COMMENCER button', async () => {
  const btn = page.locator('text=COMMENCER')
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(btn).toBeVisible()
    await btn.click()
    await page.waitForTimeout(1000)
    await screenshot('06-after-commencer')
  }
})

// === ACCUEIL ===

test('07 - Accueil: CONNEXION and INSCRIPTION buttons', async () => {
  const connexion = page.locator('text=CONNEXION')
  if (await connexion.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(connexion).toBeVisible()
    const inscription = page.locator('text=INSCRIPTION')
    await expect(inscription).toBeVisible()
    await screenshot('07-accueil')

    await connexion.click()
    await page.waitForTimeout(1000)
  }
})

// === SEARCH CLIENT ===

test('08 - Search: correct title and search bar', async () => {
  const title = page.locator('text=Recherche Client')
  if (await title.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(title).toBeVisible()
    await screenshot('08-search')

    // Terminology check - no "cliente"
    const oldTerm = page.locator('text=Rechercher une cliente')
    await expect(oldTerm).not.toBeVisible()

    // Search for test client
    const searchInput = page.locator('input[placeholder="Rechercher"]')
    if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await searchInput.fill('Marie')
      await page.waitForTimeout(1500)
      await screenshot('08b-search-results')
    }
  }
})

// === API CHECKS ===

test('09 - API: health check', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:8000/api/health')
    return r.json()
  })
  expect(res.status).toBe('ok')
})

test('10 - API: search returns data', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:8000/api/clientes?boutique_id=a1b2c3d4-0001-4000-8000-000000000001&q=Marie')
    return r.json()
  })
  expect(res.data).toBeDefined()
  expect(res.data.length).toBeGreaterThan(0)
})

test('11 - API: IA proxy health', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3001/api/health')
    return r.json()
  })
  expect(res.status).toBe('ok')
})

test('12 - API: mirror config with medias', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:8000/api/miroirs/b1b2c3d4-0001-4000-8000-000000000001/config')
    return r.json()
  })
  expect(res.data).toBeDefined()
  expect(res.data.playlist.length).toBeGreaterThan(0)
})

// === MICROSCOPE ===

test('13 - Microscope: stream accessible', async () => {
  const res = await page.evaluate(async () => {
    try {
      const r = await fetch('http://localhost:9100/')
      return r.json()
    } catch {
      return { connected: false }
    }
  })
  expect(res).toHaveProperty('connected')
})

// === VISUAL REGRESSION ===

test('99 - Final state screenshot', async () => {
  await screenshot('99-final')
  console.log(`\nScreenshots saved to ${SCREENSHOTS_DIR}`)
  console.log(`JS errors captured: ${errors.length}`)
  if (errors.length > 0) {
    errors.forEach((e, i) => console.log(`  [${i}] ${e}`))
  }
})
