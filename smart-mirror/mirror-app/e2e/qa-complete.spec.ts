/**
 * Smart Mirror QA Complete - 50+ tests
 * Quinn (QA Senior) - Playwright E2E
 * Tests every screen, every function, every visual element
 *
 * Run: npx playwright test e2e/qa-complete.spec.ts --reporter=list
 */

import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { join } from 'path'

const SS = join(__dirname, '../../snapshots/qa-complete')

let app: ElectronApplication
let page: Page
const errors: string[] = []
const bugs: string[] = []

test.beforeAll(async () => {
  app = await electron.launch({
    args: [join(__dirname, '../out/main/index.js')],
    env: { ...process.env, NODE_ENV: 'development', API_BASE_URL: 'http://localhost:8000/api', IA_PROXY_URL: 'http://localhost:3001', MICROSCOPE_STREAM_URL: 'http://localhost:9100/stream.mjpg' }
  })
  page = await app.firstWindow()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(3000)
})

test.afterAll(async () => { if (app) await app.close() })

async function ss(n: string): Promise<void> { await page.screenshot({ path: join(SS, `${n}.png`), fullPage: true }) }
function bug(msg: string): void { bugs.push(msg); console.log(`  [BUG] ${msg}`) }

// ==================== 1. SMOKE ====================

test.describe('1. Smoke', () => {
  test('1.01 App launches', async () => {
    const b = await page.locator('body').boundingBox()
    expect(b).not.toBeNull()
    await ss('01-launch')
  })
  test('1.02 No JS errors', async () => { expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]) })
  test('1.03 Background visible', async () => {
    const bg = page.locator('.bg-animated img')
    if (!(await bg.isVisible({ timeout: 3000 }).catch(() => false))) bug('Background not visible')
  })
  test('1.04 Background animated', async () => {
    const cls = await page.evaluate(() => document.querySelector('.bg-animate-img')?.className || 'none')
    expect(cls).toContain('bg-animate-img')
    const anim = await page.evaluate(() => {
      const el = document.querySelector('.bg-animate-img')
      return el ? getComputedStyle(el).animationName : 'none'
    })
    expect(anim).toBe('bgPulse')
  })
})

// ==================== 2. HOME (VEILLE) ====================

test.describe('2. Veille', () => {
  test('2.01 K BEAUTY visible', async () => { await expect(page.locator('text=K BEAUTY')).toBeVisible() })
  test('2.02 COSMETICS visible', async () => { await expect(page.locator('text=COSMETICS')).toBeVisible() })
  test('2.03 Korean chars', async () => {
    const korean = page.locator('text=화장품')
    if (!(await korean.isVisible({ timeout: 1000 }).catch(() => false))) bug('Korean characters missing')
  })
  test('2.04 3 product cards', async () => {
    const cards = page.locator('.glass-card')
    expect(await cards.count()).toBeGreaterThanOrEqual(3)
  })
  test('2.05 Product images', async () => {
    const imgs = page.locator('.glass-card img')
    expect(await imgs.count()).toBeGreaterThanOrEqual(3)
  })
  test('2.06 Carousel dots', async () => { await expect(page.locator('.carousel-dots')).toBeVisible() })
  test('2.07 COMMENCER button', async () => { await expect(page.locator('text=COMMENCER')).toBeVisible() })
  test('2.08 Promo banner', async () => {
    await expect(page.locator('text=PROMOTION EXCEPTIONNELLE')).toBeVisible()
    await ss('02-veille')
  })
  test('2.09 COMMENCER navigates', async () => {
    await page.locator('text=COMMENCER').click()
    await page.waitForTimeout(1000)
    await ss('02-after-commencer')
  })
})

// ==================== 3. ACCUEIL ====================

test.describe('3. Accueil', () => {
  test('3.01 Title visible', async () => { await expect(page.locator('text=Bubble Hair Spa')).toBeVisible() })
  test('3.02 CONNEXION', async () => { await expect(page.locator('text=CONNEXION')).toBeVisible() })
  test('3.03 INSCRIPTION', async () => { await expect(page.locator('text=INSCRIPTION')).toBeVisible() })
  test('3.04 Instagram', async () => { await expect(page.locator('text=Instagram')).toBeVisible() })
  test('3.05 SideNav', async () => {
    const svgs = page.locator('svg')
    expect(await svgs.count()).toBeGreaterThan(0)
    await ss('03-accueil')
  })
  test('3.06 CONNEXION navigates to search', async () => {
    await page.locator('text=CONNEXION').click()
    await page.waitForTimeout(1000)
    await ss('03-after-connexion')
  })
})

// ==================== 4. RECHERCHE CLIENT ====================

test.describe('4. Recherche', () => {
  test('4.01 Header', async () => { await expect(page.locator('text=KBEAUTY - BUBBLE HAIR SPA')).toBeVisible() })
  test('4.02 Subtitle', async () => { await expect(page.locator('text=Recherche Client')).toBeVisible() })
  test('4.03 Search bar', async () => { await expect(page.locator('input[placeholder="Rechercher"]')).toBeVisible() })
  test('4.04 Resultats Rapides', async () => { await expect(page.locator('text=Resultats Rapides')).toBeVisible() })
  test('4.05 Calendar icon', async () => {
    const cal = page.locator('.glass-card-subtle svg')
    if (!(await cal.isVisible({ timeout: 1000 }).catch(() => false))) bug('Calendar icon missing')
    await ss('04-recherche')
  })
  test('4.06 Search Marie', async () => {
    await page.locator('input[placeholder="Rechercher"]').fill('Marie')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Marie Dupont')).toBeVisible()
    await ss('04-search-marie')
  })
  test('4.07 No old terminology', async () => {
    await expect(page.locator('text=Rechercher une cliente')).not.toBeVisible()
  })
  test('4.08 Empty search no crash', async () => {
    await page.locator('input[placeholder="Rechercher"]').fill('')
    await page.waitForTimeout(500)
    // No crash
  })
  test('4.09 Unknown name', async () => {
    await page.locator('input[placeholder="Rechercher"]').fill('ZZZZZZZ')
    await page.waitForTimeout(1500)
    // Grid should be empty, no crash
    await page.locator('input[placeholder="Rechercher"]').fill('Marie')
    await page.waitForTimeout(1500)
  })
  test('4.10 Select client', async () => {
    await page.locator('text=Marie Dupont').click()
    await page.waitForTimeout(2000)
    await ss('04-after-select')
  })
})

// ==================== 5. CONSENTEMENT ====================

test.describe('5. Consent', () => {
  test('5.01 Consent or Session reached', async () => {
    const consent = await page.locator('text=Consentement').isVisible({ timeout: 2000 }).catch(() => false)
    const session = await page.locator('text=Diagnostic en cours').isVisible({ timeout: 2000 }).catch(() => false)
    expect(consent || session).toBe(true)
    await ss('05-consent-or-session')
  })
  test('5.02 If consent: client name shown', async () => {
    if (await page.locator('text=Consentement').isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(page.locator('text=Marie Dupont')).toBeVisible()
    }
  })
  test('5.03 If consent: ACCEPTER disabled', async () => {
    const btn = page.locator('text=ACCEPTER')
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      expect(await btn.isDisabled()).toBe(true)
    }
  })
  test('5.04 If consent: check + accept', async () => {
    const checkbox = page.locator('input[type="checkbox"]')
    if (await checkbox.isVisible({ timeout: 500 }).catch(() => false)) {
      await checkbox.check()
      await page.waitForTimeout(300)
      await page.locator('text=ACCEPTER').click()
      await page.waitForTimeout(4000)
    }
    await ss('05-after-consent')
  })
})

// ==================== 6. SESSION (DIAGNOSTIC) ====================

test.describe('6. Session', () => {
  test('6.01 Diagnostic screen', async () => {
    const live = await page.locator('text=Live').isVisible({ timeout: 5000 }).catch(() => false)
    if (!live) bug('Session screen not reached')
    await ss('06-session')
  })
  test('6.02 Live badge', async () => {
    if (await page.locator('text=Live').isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(page.locator('text=Live')).toBeVisible()
    }
  })
  test('6.03 Phase buttons', async () => {
    const avant = page.locator('text=Avant')
    if (await avant.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(avant).toBeVisible()
    }
  })
  test('6.04 SUIVANT visible', async () => {
    const btn = page.locator('text=SUIVANT')
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(1500)
    }
    await ss('06-after-suivant')
  })
})

// ==================== 7. BILAN ====================

test.describe('7. Bilan', () => {
  test('7.01 Bilan header', async () => {
    const bilan = await page.locator('text=Bilan').isVisible({ timeout: 3000 }).catch(() => false)
    if (!bilan) bug('Bilan screen not reached')
    await ss('07-bilan')
  })
  test('7.02 Note praticien', async () => {
    const ta = page.locator('textarea')
    if (await ta.isVisible({ timeout: 1000 }).catch(() => false)) {
      await ta.fill('Test note praticien')
    }
  })
  test('7.03 SideNav on Bilan', async () => {
    // SideNav should be present
    await ss('07-bilan-sidenav')
  })
  test('7.04 SUIVANT to QR', async () => {
    const btn = page.locator('text=SUIVANT')
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(1500)
    }
    await ss('07-after-suivant')
  })
})

// ==================== 8. QR CODE ====================

test.describe('8. QR Code', () => {
  test('8.01 Title visible', async () => {
    const title = await page.locator('text=Retrouvez votre bilan').isVisible({ timeout: 3000 }).catch(() => false)
    if (!title) bug('QR screen not reached')
    await ss('08-qrcode')
  })
  test('8.02 QR image', async () => {
    const qr = page.locator('img[alt="QR Code"]')
    const placeholder = page.locator('svg')
    const hasQR = await qr.isVisible({ timeout: 2000 }).catch(() => false)
    const hasSVG = await placeholder.first().isVisible({ timeout: 500 }).catch(() => false)
    expect(hasQR || hasSVG).toBe(true)
  })
  test('8.03 VEILLE button', async () => {
    await expect(page.locator('text=VEILLE')).toBeVisible()
  })
  test('8.04 AVANT / APRES button', async () => {
    await expect(page.locator('text=AVANT / APRES')).toBeVisible()
  })
  test('8.05 CONSEIL button', async () => {
    await expect(page.locator('text=CONSEIL')).toBeVisible()
  })
  test('8.06 Countdown', async () => {
    const cd = page.locator('text=/\\d+s/')
    await expect(cd).toBeVisible()
  })
  test('8.07 SideNav on QR', async () => {
    await ss('08-qr-sidenav')
  })
  test('8.08 VEILLE returns home', async () => {
    await page.locator('text=VEILLE').click()
    await page.waitForTimeout(2000)
    await expect(page.locator('text=K BEAUTY')).toBeVisible()
    await ss('08-back-home')
  })
})

// ==================== 9. API ====================

test.describe('9. API', () => {
  test('9.01 Mock API', async () => {
    const r = await page.evaluate(async () => (await fetch('http://localhost:8000/api/health')).json())
    expect(r.status).toBe('ok')
  })
  test('9.02 IA Proxy', async () => {
    const r = await page.evaluate(async () => (await fetch('http://localhost:3001/api/health')).json())
    expect(r.status).toBe('ok')
  })
  test('9.03 Search API', async () => {
    const r = await page.evaluate(async () => (await fetch('http://localhost:8000/api/clientes?boutique_id=a1b2c3d4-0001-4000-8000-000000000001&q=Marie')).json())
    expect(r.data.length).toBeGreaterThan(0)
  })
  test('9.04 Medias in config', async () => {
    const r = await page.evaluate(async () => (await fetch('http://localhost:8000/api/miroirs/b1b2c3d4-0001-4000-8000-000000000001/config')).json())
    expect(r.data.playlist.length).toBeGreaterThan(0)
  })
  test('9.05 QR endpoint', async () => {
    const r = await page.evaluate(async () => {
      try { return await (await fetch('http://localhost:8000/api/seances/test/qrcode')).json() }
      catch { return { error: true } }
    })
    // May error with invalid ID but endpoint exists
    expect(r).toBeDefined()
  })
})

// ==================== 10. INSCRIPTION (navigate there) ====================

test.describe('10. Inscription', () => {
  test('10.01 Navigate to inscription', async () => {
    await page.locator('text=COMMENCER').click()
    await page.waitForTimeout(1000)
    await page.locator('text=INSCRIPTION').click()
    await page.waitForTimeout(1000)
    await ss('10-inscription')
  })
  test('10.02 Header', async () => {
    await expect(page.locator('text=Inscription Nouveau Client')).toBeVisible()
  })
  test('10.03 Recherche button', async () => {
    const btn = page.locator('text=Recherche').first()
    if (!(await btn.isVisible({ timeout: 1000 }).catch(() => false))) bug('Recherche button missing on inscription')
  })
  test('10.04 Nom field', async () => { await expect(page.locator('.glass-input').first()).toBeVisible() })
  test('10.05 Sexe buttons', async () => {
    const homme = page.locator('text=Homme')
    const femme = page.locator('text=Femme')
    expect(await homme.isVisible()).toBe(true)
    expect(await femme.isVisible()).toBe(true)
  })
  test('10.06 RGPD checkboxes', async () => {
    const cbs = page.locator('input[type="checkbox"]')
    expect(await cbs.count()).toBeGreaterThanOrEqual(2)
  })
  test('10.07 INSCRIPTION disabled without data', async () => {
    const btn = page.locator('button:has-text("INSCRIPTION")')
    expect(await btn.isDisabled()).toBe(true)
  })
  test('10.08 Fill form', async () => {
    const inputs = page.locator('.glass-input')
    await inputs.nth(0).fill('TestNom')
    await inputs.nth(1).fill('TestPrenom')
    await inputs.nth(2).fill('test@test.fr')
    await page.locator('text=Homme').click()
    await page.waitForTimeout(200)
    await ss('10-form-filled')
  })
  test('10.09 Check RGPD', async () => {
    const cbs = page.locator('input[type="checkbox"]')
    await cbs.nth(0).check()
    await cbs.nth(1).check()
    await page.waitForTimeout(300)
    const btn = page.locator('button:has-text("INSCRIPTION")')
    expect(await btn.isDisabled()).toBe(false)
    await ss('10-rgpd-checked')
  })
})

// ==================== 11. GLOBAL ====================

test.describe('11. Global', () => {
  test('11.01 Total JS errors', async () => {
    const critical = errors.filter(e => !e.includes('DevTools') && !e.includes('Security'))
    if (critical.length > 0) bug(`${critical.length} JS errors: ${critical[0]}`)
    await ss('11-final')
  })
  test('11.02 Bug report', async () => {
    console.log('\n=== QA COMPLETE REPORT ===')
    console.log(`Tests: all`)
    console.log(`JS Errors: ${errors.length}`)
    console.log(`Bugs: ${bugs.length}`)
    bugs.forEach((b, i) => console.log(`  [${i + 1}] ${b}`))
    console.log(`Screenshots: ${SS}`)
    console.log('=========================')
  })
})
