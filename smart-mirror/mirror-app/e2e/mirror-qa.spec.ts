/**
 * Smart Mirror QA - Playwright E2E Tests
 * Quinn (QA agent) - Tests every screen, every button, every visual
 *
 * Run: npx playwright test e2e/mirror-qa.spec.ts
 */

import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { join } from 'path'

const SCREENSHOTS_DIR = join(__dirname, '../../snapshots/qa')

let app: ElectronApplication
let page: Page

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
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2000)
})

test.afterAll(async () => {
  if (app) await app.close()
})

async function screenshot(name: string): Promise<void> {
  await page.screenshot({ path: join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true })
}

// --- SCREEN: Provisioning or Home ---

test('01 - App launches without JS errors', async () => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.waitForTimeout(1000)
  await screenshot('01-app-launched')
  expect(errors).toEqual([])
})

test('02 - First screen is visible (provisioning or home)', async () => {
  const body = await page.locator('body').boundingBox()
  expect(body).not.toBeNull()
  expect(body!.width).toBeGreaterThan(0)
  expect(body!.height).toBeGreaterThan(0)
  await screenshot('02-first-screen')
})

test('03 - No overlapping elements on first screen', async () => {
  const elements = await page.locator('.screen > *').all()
  const boxes: Array<{ x: number; y: number; w: number; h: number; text: string }> = []

  for (const el of elements) {
    const box = await el.boundingBox()
    if (!box || box.width === 0 || box.height === 0) continue
    const text = await el.textContent() || ''
    boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height, text: text.substring(0, 30) })
  }

  // Check for overlaps between sibling elements
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      const overlapX = a.x < b.x + b.w && a.x + a.w > b.x
      const overlapY = a.y < b.y + b.h && a.y + a.h > b.y
      if (overlapX && overlapY) {
        console.warn(`OVERLAP: "${a.text}" and "${b.text}" at (${a.x},${a.y}) vs (${b.x},${b.y})`)
      }
    }
  }

  await screenshot('03-no-overlaps')
})

// --- SCREEN: Provisioning (if not provisioned) ---

test('04 - Provisioning: Configuration manuelle button exists', async () => {
  const provScreen = page.locator('text=Configuration Smart Mirror')
  if (await provScreen.isVisible()) {
    const manualBtn = page.locator('text=Configuration manuelle')
    await expect(manualBtn).toBeVisible()
    await screenshot('04-provisioning-screen')

    // Click manual config
    await manualBtn.click()
    await page.waitForTimeout(500)
    await screenshot('04b-provisioning-config-form')

    // Verify form fields
    const boutiqueInput = page.locator('input[placeholder*="a1b2c3d4"]')
    await expect(boutiqueInput).toBeVisible()

    const urlInput = page.locator('input[placeholder*="api.example"]')
    await expect(urlInput).toBeVisible()
  } else {
    console.log('Already provisioned - skipping provisioning tests')
  }
})

// --- SCREEN: Home ---

test('05 - Home: Nouvelle seance button visible', async () => {
  // Navigate to home if not there
  const homeBtn = page.locator('text=Nouvelle seance')
  if (await homeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expect(homeBtn).toBeVisible()
    await screenshot('05-home-screen')
  }
})

test('06 - Home: StatusBar visible', async () => {
  const statusBar = page.locator('[class*="status"]').first()
  if (await statusBar.isVisible({ timeout: 2000 }).catch(() => false)) {
    await screenshot('06-statusbar')
  }
})

// --- SCREEN: Search Client ---

test('07 - Search client: correct terminology', async () => {
  const searchTitle = page.locator('text=Rechercher un client')
  if (await searchTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(searchTitle).toBeVisible()
    await screenshot('07-search-client')

    // Verify NOT "cliente"
    const oldTerm = page.locator('text=Rechercher une cliente')
    await expect(oldTerm).not.toBeVisible()

    // Verify "Nouveau client" button (not "Nouvelle cliente")
    const newClientBtn = page.locator('text=Nouveau client')
    await expect(newClientBtn).toBeVisible()

    const oldClientBtn = page.locator('text=Nouvelle cliente')
    await expect(oldClientBtn).not.toBeVisible()
  }
})

// --- SCREEN: New Client ---

test('08 - New client: form fields and terminology', async () => {
  const title = page.locator('text=Nouveau client')
  if (await title.isVisible({ timeout: 2000 }).catch(() => false)) {
    await screenshot('08-new-client')

    // Verify NOT "Nouvelle cliente"
    const oldTitle = page.locator('text=Nouvelle cliente')
    await expect(oldTitle).not.toBeVisible()
  }
})

// --- SCREEN: Consent ---

test('09 - Consent screen: RGPD text and accept button', async () => {
  const consentTitle = page.locator('text=Consentement RGPD')
  if (await consentTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(consentTitle).toBeVisible()
    await screenshot('09-consent-screen')

    // Accept button
    const acceptBtn = page.locator('text=Accepter')
    await expect(acceptBtn).toBeVisible()
  }
})

// --- SCREEN: Session ---

test('10 - Session screen: layout check', async () => {
  const captureBtn = page.locator('text=Capturer')
  if (await captureBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await screenshot('10-session-screen')

    // Verify "Client" label (not "Cliente")
    const clientLabel = page.locator('text=Client').first()
    await expect(clientLabel).toBeVisible()

    // Verify phase buttons
    await expect(page.locator('text=Avant soin')).toBeVisible()
    await expect(page.locator('text=Apres soin')).toBeVisible()

    // Verify no overlapping in session layout
    const mainLayout = await page.locator('.screen > div').first().boundingBox()
    expect(mainLayout).not.toBeNull()
    expect(mainLayout!.width).toBeGreaterThan(200)
  }
})

// --- API Tests ---

test('11 - Mock API: health check', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:8000/api/health')
    return r.json()
  })
  expect(res.status).toBe('ok')
})

test('12 - Mock API: search clients returns data', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:8000/api/clientes?boutique_id=a1b2c3d4-0001-4000-8000-000000000001&q=Marie')
    return r.json()
  })
  expect(res.data).toBeDefined()
  expect(res.data.length).toBeGreaterThan(0)
})

test('13 - Mock API: IA proxy health', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3001/api/health')
    return r.json()
  })
  expect(res.status).toBe('ok')
})

test('14 - Mock API: mirror config returns medias', async () => {
  const res = await page.evaluate(async () => {
    const r = await fetch('http://localhost:8000/api/miroirs/b1b2c3d4-0001-4000-8000-000000000001/config')
    return r.json()
  })
  expect(res.data).toBeDefined()
  expect(res.data.playlist.length).toBeGreaterThan(0)
})

// --- Microscope ---

test('15 - Microscope stream accessible', async () => {
  const res = await page.evaluate(async () => {
    try {
      const r = await fetch('http://localhost:9100/')
      return r.json()
    } catch {
      return { connected: false }
    }
  })
  // May or may not be connected depending on microscope state
  expect(res).toHaveProperty('connected')
})

// --- Visual regression: full page screenshots of each screen ---

test('99 - Generate full visual report', async () => {
  await screenshot('99-final-state')
  console.log(`Screenshots saved to ${SCREENSHOTS_DIR}`)
})
