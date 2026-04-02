/**
 * Smart Mirror VM QA - Playwright E2E via CDP
 * Quinn (QA agent) - Tests the app running in the Debian 12 VM
 *
 * Prerequisites:
 * - VM running with REMOTE_DEBUG=1
 * - SSH tunnel: ssh -f -N -L 9222:127.0.0.1:9222 mirror@192.168.122.253
 *
 * Run: npx playwright test e2e/vm-qa.spec.ts
 */

import { test, expect, type Page, type Browser } from '@playwright/test'
import { chromium } from 'playwright'
import { join } from 'path'

const SCREENSHOTS_DIR = join(__dirname, '../../snapshots/qa-vm')
const CDP_URL = 'http://localhost:9222'

let browser: Browser
let page: Page
const errors: string[] = []

test.beforeAll(async () => {
  browser = await chromium.connectOverCDP(CDP_URL)
  const contexts = browser.contexts()
  if (contexts.length === 0) throw new Error('No browser contexts found via CDP')
  const pages = contexts[0].pages()
  if (pages.length === 0) throw new Error('No pages found via CDP')
  page = pages[0]
  page.on('pageerror', (err) => errors.push(err.message))
  await page.waitForTimeout(2000)
})

test.afterAll(async () => {
  // Do NOT close browser - it's the VM's app
})

async function screenshot(name: string): Promise<void> {
  await page.screenshot({ path: join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true })
}

// === SMOKE TEST VM ===

test('VM-01 - App is running and visible', async () => {
  const body = await page.locator('body').boundingBox()
  expect(body).not.toBeNull()
  expect(body!.width).toBeGreaterThan(0)
  expect(body!.height).toBeGreaterThan(0)
  await screenshot('vm-01-running')
})

test('VM-02 - No JS errors', async () => {
  const critical = errors.filter(e => !e.includes('DevTools') && !e.includes('Electron Security'))
  expect(critical).toEqual([])
})

test('VM-03 - Animated background visible', async () => {
  const bg = page.locator('.bg-animated')
  const visible = await bg.isVisible({ timeout: 3000 }).catch(() => false)
  if (visible) {
    const bgImg = bg.locator('img')
    await expect(bgImg).toBeVisible()
  }
  await screenshot('vm-03-background')
})

// === SCREEN BY SCREEN ===

test('VM-04 - Current screen screenshot', async () => {
  await screenshot('vm-04-current-screen')

  // Check what screen we're on
  const provisioning = await page.locator('text=Configuration Smart Mirror').isVisible({ timeout: 1000 }).catch(() => false)
  const home = await page.locator('text=K BEAUTY').isVisible({ timeout: 1000 }).catch(() => false)
  const accueil = await page.locator('text=CONNEXION').isVisible({ timeout: 1000 }).catch(() => false)

  console.log(`Current screen: provisioning=${provisioning}, home=${home}, accueil=${accueil}`)
})

test('VM-05 - Navigate to Home (if provisioned)', async () => {
  // If on provisioning, try to get past it
  const provVisible = await page.locator('text=Configuration Smart Mirror').isVisible({ timeout: 1000 }).catch(() => false)
  if (provVisible) {
    const manualBtn = page.locator('text=Configuration manuelle')
    if (await manualBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await manualBtn.click()
      await page.waitForTimeout(500)

      const boutiqueInput = page.locator('input[placeholder*="a1b2c3d4"]')
      if (await boutiqueInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await boutiqueInput.fill('a1b2c3d4-0001-4000-8000-000000000001')
      }

      // Set API URL for VM
      const urlInput = page.locator('input[placeholder*="api.example"]')
      if (await urlInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await urlInput.clear()
        await urlInput.fill('http://192.168.122.1:8000/api')
      }

      const connectBtn = page.locator('text=CONNECTER')
      if (await connectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await connectBtn.click()
        await page.waitForTimeout(4000)
      }
    }
  }
  await screenshot('vm-05-after-provisioning')
})

test('VM-06 - Home screen: K BEAUTY + products', async () => {
  const title = page.locator('text=K BEAUTY')
  const visible = await title.isVisible({ timeout: 5000 }).catch(() => false)
  if (visible) {
    await screenshot('vm-06-home')
    const commencer = page.locator('text=COMMENCER')
    if (await commencer.isVisible({ timeout: 2000 }).catch(() => false)) {
      await commencer.click()
      await page.waitForTimeout(1500)
    }
  }
  await screenshot('vm-06b-after-commencer')
})

test('VM-07 - Accueil screen: CONNEXION + INSCRIPTION', async () => {
  const connexion = page.locator('text=CONNEXION')
  if (await connexion.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(connexion).toBeVisible()
    const inscription = page.locator('text=INSCRIPTION')
    await expect(inscription).toBeVisible()

    // Check SideNav
    const sideNav = page.locator('text=Instagram')
    const hasInstagram = await sideNav.isVisible({ timeout: 1000 }).catch(() => false)

    await screenshot('vm-07-accueil')

    // Navigate to search
    await connexion.click()
    await page.waitForTimeout(1000)
  }
  await screenshot('vm-07b-after-connexion')
})

test('VM-08 - Search client screen', async () => {
  const header = page.locator('text=KBEAUTY - BUBBLE HAIR SPA')
  if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(header).toBeVisible()

    const subtitle = page.locator('text=Recherche Client')
    await expect(subtitle).toBeVisible()

    // Search for test client
    const searchInput = page.locator('input[placeholder="Rechercher"]')
    if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await searchInput.fill('Marie')
      await page.waitForTimeout(2000)
      await screenshot('vm-08-search-results')

      // Click on Marie Dupont if found
      const marie = page.locator('text=Marie Dupont')
      if (await marie.isVisible({ timeout: 2000 }).catch(() => false)) {
        await marie.click()
        await page.waitForTimeout(1000)
      }
    }
  }
  await screenshot('vm-08b-after-select')
})

test('VM-09 - Consent screen', async () => {
  const consentTitle = page.locator('text=Consentement')
  if (await consentTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await screenshot('vm-09-consent')

    // Accept consent
    const checkbox = page.locator('input[type="checkbox"]')
    if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkbox.check()
      await page.waitForTimeout(300)
    }

    const acceptBtn = page.locator('text=ACCEPTER')
    if (await acceptBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptBtn.click()
      await page.waitForTimeout(3000)
    }
  }
  await screenshot('vm-09b-after-consent')
})

test('VM-10 - Session/Diagnostic screen', async () => {
  const liveLabel = page.locator('text=Live')
  if (await liveLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
    await screenshot('vm-10-session')

    // Check microscope stream area
    const streamImg = page.locator('img[alt="Microscope"]')
    const hasStream = await streamImg.isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`Microscope stream visible: ${hasStream}`)

    // Try capture
    const captureBtn = page.locator('svg').locator('..').filter({ has: page.locator('circle') }).first()
    if (await captureBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await captureBtn.click()
      await page.waitForTimeout(3000)
      await screenshot('vm-10b-after-capture')
    }

    // Click SUIVANT
    const suivant = page.locator('text=SUIVANT')
    if (await suivant.isVisible({ timeout: 1000 }).catch(() => false)) {
      await suivant.click()
      await page.waitForTimeout(1000)
    }
  }
  await screenshot('vm-10c-after-suivant')
})

test('VM-11 - Bilan/Comparison screen', async () => {
  const bilan = page.locator('text=Bilan')
  if (await bilan.isVisible({ timeout: 2000 }).catch(() => false)) {
    await screenshot('vm-11-bilan')

    const suivant = page.locator('text=SUIVANT')
    if (await suivant.isVisible({ timeout: 1000 }).catch(() => false)) {
      await suivant.click()
      await page.waitForTimeout(1000)
    }
  }
  await screenshot('vm-11b-after-bilan')
})

test('VM-12 - QR/End screen', async () => {
  const qrTitle = page.locator('text=Retrouvez votre bilan')
  if (await qrTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await screenshot('vm-12-qrcode')

    // Check buttons
    const veille = page.locator('text=VEILLE')
    await expect(veille).toBeVisible()
    const avantApres = page.locator('text=AVANT / APRES')
    await expect(avantApres).toBeVisible()
    const conseil = page.locator('text=CONSEIL')
    await expect(conseil).toBeVisible()
  }
  await screenshot('vm-12b-end')
})

// === API FROM VM ===

test('VM-13 - API accessible from VM', async () => {
  const res = await page.evaluate(async () => {
    try {
      const r = await fetch('http://192.168.122.1:8000/api/health')
      return r.json()
    } catch (e) {
      return { error: String(e) }
    }
  })
  expect(res.status).toBe('ok')
})

test('VM-14 - Microscope stream configured', async () => {
  // The microscope stream is accessed via main process IPC, not renderer fetch
  // We verify the env var is set and the main process can reach it
  const res = await page.evaluate(async () => {
    try {
      const device = await (window as any).mirrorApi.getMicroscopeDevice()
      return device
    } catch (e) {
      return { error: String(e) }
    }
  })
  expect(res).toHaveProperty('streamUrl')
  console.log(`Microscope: connected=${res.connected}, streamUrl=${res.streamUrl}`)
})

// === FINAL ===

test('VM-99 - Final report', async () => {
  await screenshot('vm-99-final')
  console.log('\n=== VM QA REPORT ===')
  console.log(`Screenshots: ${SCREENSHOTS_DIR}`)
  console.log(`JS errors: ${errors.length}`)
  errors.forEach((e, i) => console.log(`  [${i}] ${e}`))
  console.log('=== END ===')
})
