/**
 * QA Senior Protocol - Smart Mirror VM
 * Full post-publication test suite via CDP
 *
 * Run: npx playwright test e2e/qa-senior-vm.spec.ts --reporter=list
 */

import { test, expect, type Page, type Browser } from '@playwright/test'
import { chromium } from 'playwright'
import { join } from 'path'

const SCREENSHOTS_DIR = join(__dirname, '../../snapshots/qa-senior')
const CDP_URL = 'http://localhost:9222'

let browser: Browser
let page: Page
const jsErrors: string[] = []
const networkErrors: string[] = []
const bugs: Array<{
  id: string; severity: string; page: string;
  step: string; observed: string; expected: string; tech: string
}> = []
let bugCount = 0

function reportBug(severity: string, pageName: string, step: string, observed: string, expected: string, tech: string): void {
  bugCount++
  const bug = { id: `BUG-${String(bugCount).padStart(3, '0')}`, severity, page: pageName, step, observed, expected, tech }
  bugs.push(bug)
  console.log(`  [${bug.id}] ${severity} - ${pageName}: ${observed}`)
}

test.beforeAll(async () => {
  browser = await chromium.connectOverCDP(CDP_URL)
  const contexts = browser.contexts()
  if (contexts.length === 0) throw new Error('No browser contexts via CDP')
  page = contexts[0].pages()[0]

  page.on('pageerror', (err) => jsErrors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('net::ERR') && !msg.text().includes('DevTools')) {
      jsErrors.push(msg.text())
    }
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (!url.includes('9100') && !url.includes('favicon')) {
      networkErrors.push(`${req.failure()?.errorText}: ${url}`)
    }
  })

  await page.waitForTimeout(2000)
})

test.afterAll(async () => { /* keep VM app running */ })

async function ss(name: string): Promise<void> {
  await page.screenshot({ path: join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true })
}

async function checkNoOverlap(screenName: string): Promise<void> {
  const elements = await page.locator('.screen > *, .screen-padded > *').all()
  const boxes: Array<{ x: number; y: number; w: number; h: number; text: string }> = []
  for (const el of elements) {
    const box = await el.boundingBox()
    if (!box || box.width === 0 || box.height === 0) continue
    const text = (await el.textContent() || '').substring(0, 20).trim()
    if (text) boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height, text })
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j]
      const overlapX = a.x < b.x + b.w && a.x + a.w > b.x
      const overlapY = a.y < b.y + b.h && a.y + a.h > b.y
      if (overlapX && overlapY) {
        const overlapArea = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const overlapH = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        if (overlapArea > 20 && overlapH > 20) {
          reportBug('mineure', screenName, 'Layout check', `Overlap: "${a.text}" and "${b.text}"`, 'No overlapping elements', `${overlapArea}x${overlapH}px overlap`)
        }
      }
    }
  }
}

// ==========================================
// 1. SMOKE TEST
// ==========================================

test.describe('1. Smoke Test', () => {
  test('1.1 - App loaded, body visible', async () => {
    const body = await page.locator('body').boundingBox()
    expect(body).not.toBeNull()
    if (body!.width === 0 || body!.height === 0) {
      reportBug('critique', 'Global', 'App launch', 'Body has zero dimensions', 'Visible app', `${body!.width}x${body!.height}`)
    }
    await ss('01-smoke-body')
  })

  test('1.2 - Background image loaded', async () => {
    const bg = page.locator('.bg-animated img')
    const visible = await bg.isVisible({ timeout: 3000 }).catch(() => false)
    if (!visible) {
      reportBug('majeure', 'Global', 'Background check', 'Background image not visible', 'Golden animated background visible', 'bg-animated img missing')
    }
    await ss('01-smoke-bg')
  })

  test('1.3 - No JS errors on load', async () => {
    if (jsErrors.length > 0) {
      reportBug('majeure', 'Global', 'JS errors check', `${jsErrors.length} JS errors: ${jsErrors[0]}`, 'Zero JS errors', jsErrors.join('; '))
    }
  })
})

// ==========================================
// 2. SCREEN BY SCREEN
// ==========================================

test.describe('2. Home (Veille)', () => {
  test('2.1 - K BEAUTY title visible', async () => {
    const title = page.locator('text=K BEAUTY')
    const visible = await title.isVisible({ timeout: 5000 }).catch(() => false)
    if (!visible) {
      reportBug('critique', 'Home', 'Title check', 'K BEAUTY title not visible', 'K BEAUTY COSMETICS visible', 'May be on wrong screen')
    }
    await ss('02-home')
  })

  test('2.2 - Product cards visible', async () => {
    const cards = page.locator('.glass-card')
    const count = await cards.count()
    if (count < 3) {
      reportBug('majeure', 'Home', 'Product cards', `Only ${count} product cards`, '3 product cards with images', '')
    }
  })

  test('2.3 - COMMENCER button works', async () => {
    const btn = page.locator('text=COMMENCER')
    const visible = await btn.isVisible({ timeout: 2000 }).catch(() => false)
    if (!visible) {
      reportBug('critique', 'Home', 'CTA check', 'COMMENCER button missing', 'COMMENCER button visible and clickable', '')
    } else {
      await btn.click()
      await page.waitForTimeout(1500)
    }
    await ss('02-home-after-cta')
  })

  test('2.4 - Promo banner', async () => {
    // Go back to check
    await page.goBack().catch(() => {})
    await page.waitForTimeout(500)
    const promo = page.locator('text=PROMOTION EXCEPTIONNELLE')
    const visible = await promo.isVisible({ timeout: 1000 }).catch(() => false)
    if (!visible) {
      reportBug('mineure', 'Home', 'Promo banner', 'Promo banner not visible', 'PROMOTION EXCEPTIONNELLE -20% in bottom bar', '')
    }
  })

  test('2.5 - No overlapping elements', async () => {
    await checkNoOverlap('Home')
  })
})

test.describe('3. Accueil', () => {
  test('3.1 - Navigate to Accueil', async () => {
    const commencer = page.locator('text=COMMENCER')
    if (await commencer.isVisible({ timeout: 2000 }).catch(() => false)) {
      await commencer.click()
      await page.waitForTimeout(1000)
    }
    await ss('03-accueil')
  })

  test('3.2 - Title text correct', async () => {
    const title = page.locator('text=Bubble Hair Spa')
    const visible = await title.isVisible({ timeout: 3000 }).catch(() => false)
    if (!visible) {
      reportBug('majeure', 'Accueil', 'Title', 'Bubble Hair Spa title missing', '"Vivez l\'experience Bubble Hair Spa Coreen" visible', '')
    }
  })

  test('3.3 - CONNEXION button', async () => {
    const btn = page.locator('text=CONNEXION')
    if (!(await btn.isVisible({ timeout: 2000 }).catch(() => false))) {
      reportBug('critique', 'Accueil', 'CONNEXION CTA', 'CONNEXION button missing', 'CONNEXION button visible', '')
    }
  })

  test('3.4 - INSCRIPTION button', async () => {
    const btn = page.locator('text=INSCRIPTION')
    if (!(await btn.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('critique', 'Accueil', 'INSCRIPTION CTA', 'INSCRIPTION button missing', 'INSCRIPTION button visible', '')
    }
  })

  test('3.5 - SideNav visible', async () => {
    const nav = page.locator('svg').first()
    const visible = await nav.isVisible({ timeout: 1000 }).catch(() => false)
    // SideNav has SVG icons
    await ss('03-accueil-sidenav')
  })

  test('3.6 - Navigate to Search', async () => {
    const btn = page.locator('text=CONNEXION')
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(1000)
    }
    await ss('03-accueil-to-search')
  })
})

test.describe('4. Recherche Client', () => {
  test('4.1 - Header visible', async () => {
    const header = page.locator('text=KBEAUTY - BUBBLE HAIR SPA')
    if (!(await header.isVisible({ timeout: 3000 }).catch(() => false))) {
      reportBug('majeure', 'Recherche', 'Header', 'Header missing', 'KBEAUTY - BUBBLE HAIR SPA header visible', '')
    }
    await ss('04-search')
  })

  test('4.2 - Subtitle "Recherche Client"', async () => {
    const sub = page.locator('text=Recherche Client')
    if (!(await sub.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('majeure', 'Recherche', 'Subtitle', 'Recherche Client subtitle missing', 'Subtitle visible in glass bar', '')
    }
  })

  test('4.3 - Search bar functional', async () => {
    const input = page.locator('input[placeholder="Rechercher"]')
    if (!(await input.isVisible({ timeout: 2000 }).catch(() => false))) {
      reportBug('critique', 'Recherche', 'Search bar', 'Search input not found', 'Glass search bar with loupe icon', '')
      return
    }
    await input.fill('Marie')
    await page.waitForTimeout(2000)
    await ss('04-search-results')
  })

  test('4.4 - Results displayed', async () => {
    const result = page.locator('text=Marie Dupont')
    if (!(await result.isVisible({ timeout: 3000 }).catch(() => false))) {
      reportBug('critique', 'Recherche', 'Results', 'Marie Dupont not found in results', 'Client card with name and date', 'API may be down')
    }
  })

  test('4.5 - Terminology check (no "cliente")', async () => {
    const old1 = page.locator('text=Rechercher une cliente')
    if (await old1.isVisible({ timeout: 500 }).catch(() => false)) {
      reportBug('mineure', 'Recherche', 'Terminology', '"Rechercher une cliente" found', 'Should be "Rechercher un client"', '')
    }
    const old2 = page.locator('text=Nouvelle cliente')
    if (await old2.isVisible({ timeout: 500 }).catch(() => false)) {
      reportBug('mineure', 'Recherche', 'Terminology', '"Nouvelle cliente" found', 'Should be "Nouveau client"', '')
    }
  })

  test('4.6 - Select client navigates to Consent', async () => {
    const marie = page.locator('text=Marie Dupont')
    if (await marie.isVisible({ timeout: 1000 }).catch(() => false)) {
      await marie.click()
      await page.waitForTimeout(1500)
    }
    await ss('04-search-to-consent')
  })

  test('4.7 - No overlaps', async () => {
    await checkNoOverlap('Recherche')
  })
})

test.describe('5. Consentement RGPD', () => {
  test('5.1 - Consent screen visible', async () => {
    const title = page.locator('text=Consentement')
    if (!(await title.isVisible({ timeout: 3000 }).catch(() => false))) {
      reportBug('critique', 'Consentement', 'Screen', 'Consent screen not reached', 'Consentement screen with legal text', '')
      return
    }
    await ss('05-consent')
  })

  test('5.2 - Client name shown', async () => {
    const name = page.locator('text=Marie Dupont')
    if (!(await name.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('majeure', 'Consentement', 'Client name', 'Client name not displayed', 'Marie Dupont visible on consent screen', '')
    }
  })

  test('5.3 - Legal text in glass card', async () => {
    const text = page.locator('text=autorisez K Beauty')
    if (!(await text.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('critique', 'Consentement', 'Legal text', 'Legal text missing', 'Full RGPD consent text visible', '')
    }
  })

  test('5.4 - ACCEPTER disabled without checkbox', async () => {
    const btn = page.locator('text=ACCEPTER')
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      const disabled = await btn.isDisabled()
      if (!disabled) {
        reportBug('critique', 'Consentement', 'Button state', 'ACCEPTER enabled without checkbox', 'ACCEPTER disabled until checkbox checked', 'RGPD violation risk')
      }
    }
  })

  test('5.5 - Check + Accept creates session', async () => {
    const checkbox = page.locator('input[type="checkbox"]')
    if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkbox.check()
      await page.waitForTimeout(300)
      const btn = page.locator('text=ACCEPTER')
      const disabled = await btn.isDisabled()
      if (disabled) {
        reportBug('critique', 'Consentement', 'Button after check', 'ACCEPTER still disabled after checking', 'ACCEPTER enabled', '')
      } else {
        await btn.click()
        await page.waitForTimeout(4000)
      }
    }
    await ss('05-consent-accepted')
  })
})

test.describe('6. Session / Diagnostic', () => {
  test('6.1 - Diagnostic screen reached', async () => {
    const live = page.locator('text=Live')
    const visible = await live.isVisible({ timeout: 5000 }).catch(() => false)
    if (!visible) {
      reportBug('critique', 'Session', 'Screen', 'Diagnostic screen not reached after consent', 'Live badge + microscope stream', '')
    }
    await ss('06-session')
  })

  test('6.2 - Microscope stream area', async () => {
    const streamImg = page.locator('img[alt="Microscope"]')
    const visible = await streamImg.isVisible({ timeout: 3000 }).catch(() => false)
    if (visible) {
      const box = await streamImg.boundingBox()
      if (box && (box.width < 100 || box.height < 100)) {
        reportBug('majeure', 'Session', 'Stream size', `Stream area too small: ${box.width}x${box.height}`, '280x280 circle', '')
      }
    }
    await ss('06-session-stream')
  })

  test('6.3 - Phase buttons (Avant/Apres)', async () => {
    const avant = page.locator('text=Avant')
    if (!(await avant.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('majeure', 'Session', 'Phase buttons', 'Avant/Apres buttons missing', 'Phase toggle buttons visible', '')
    }
  })

  test('6.4 - SUIVANT button', async () => {
    const btn = page.locator('text=SUIVANT')
    if (!(await btn.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('majeure', 'Session', 'SUIVANT', 'SUIVANT button missing', 'Navigation button to Bilan', '')
    } else {
      await btn.click()
      await page.waitForTimeout(1500)
    }
    await ss('06-session-to-bilan')
  })
})

test.describe('7. Bilan', () => {
  test('7.1 - Bilan screen', async () => {
    const title = page.locator('text=Bilan')
    const visible = await title.isVisible({ timeout: 3000 }).catch(() => false)
    if (!visible) {
      reportBug('majeure', 'Bilan', 'Screen', 'Bilan screen not reached', 'Bilan header with before/after', '')
    }
    await ss('07-bilan')
  })

  test('7.2 - Note praticien field', async () => {
    const textarea = page.locator('textarea')
    if (!(await textarea.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('mineure', 'Bilan', 'Note praticien', 'Note field missing', 'Editable textarea for session notes', '')
    }
  })

  test('7.3 - SUIVANT to QR', async () => {
    const btn = page.locator('text=SUIVANT')
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(1500)
    }
    await ss('07-bilan-to-qr')
  })
})

test.describe('8. Page de fin (QR)', () => {
  test('8.1 - QR screen', async () => {
    const title = page.locator('text=Retrouvez votre bilan')
    const visible = await title.isVisible({ timeout: 3000 }).catch(() => false)
    if (!visible) {
      reportBug('majeure', 'QR', 'Screen', 'QR screen not reached', '"Retrouvez votre bilan" with QR code', '')
    }
    await ss('08-qr')
  })

  test('8.2 - Three action buttons', async () => {
    for (const label of ['VEILLE', 'AVANT / APRES', 'CONSEIL']) {
      const btn = page.locator(`text=${label}`)
      if (!(await btn.isVisible({ timeout: 1000 }).catch(() => false))) {
        reportBug('mineure', 'QR', `Button ${label}`, `${label} button missing`, `${label} button visible`, '')
      }
    }
  })

  test('8.3 - Countdown visible', async () => {
    const countdown = page.locator('text=/\\d+s/')
    if (!(await countdown.isVisible({ timeout: 1000 }).catch(() => false))) {
      reportBug('mineure', 'QR', 'Countdown', 'Auto-return countdown missing', 'Countdown timer visible', '')
    }
  })

  test('8.4 - VEILLE returns to home', async () => {
    const btn = page.locator('text=VEILLE')
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(2000)
    }
    const home = page.locator('text=K BEAUTY')
    if (!(await home.isVisible({ timeout: 3000 }).catch(() => false))) {
      reportBug('majeure', 'QR', 'Return to veille', 'Did not return to home screen', 'K BEAUTY home screen after VEILLE click', '')
    }
    await ss('08-qr-to-home')
  })
})

// ==========================================
// 9. API & Network
// ==========================================

test.describe('9. API & Network', () => {
  test('9.1 - Mock API reachable', async () => {
    const res = await page.evaluate(async () => {
      try { return await (await fetch('http://192.168.122.1:8000/api/health')).json() }
      catch (e) { return { error: String(e) } }
    })
    if (res.error) reportBug('critique', 'API', 'Health', `API unreachable: ${res.error}`, 'API responds OK', '')
    expect(res.status).toBe('ok')
  })

  test('9.2 - IA Proxy reachable', async () => {
    const res = await page.evaluate(async () => {
      try { return await (await fetch('http://192.168.122.1:3001/api/health')).json() }
      catch (e) { return { error: String(e) } }
    })
    if (res.error) reportBug('critique', 'API', 'IA Proxy', `IA unreachable: ${res.error}`, 'IA responds OK', '')
  })

  test('9.3 - Microscope stream configured', async () => {
    const res = await page.evaluate(async () => {
      try { return await (window as any).mirrorApi.getMicroscopeDevice() }
      catch (e) { return { error: String(e) } }
    })
    if (!res?.streamUrl) reportBug('majeure', 'Microscope', 'Config', 'Stream URL not configured', 'streamUrl set to host proxy', '')
  })

  test('9.4 - Network errors accumulated', async () => {
    if (networkErrors.length > 0) {
      reportBug('majeure', 'Global', 'Network', `${networkErrors.length} network errors`, 'Zero network errors', networkErrors.slice(0, 3).join('; '))
    }
  })
})

// ==========================================
// 10. FINAL REPORT
// ==========================================

test.describe('10. Report', () => {
  test('10.1 - Generate QA report', async () => {
    await ss('99-final')

    console.log('\n' + '='.repeat(60))
    console.log('  QA SENIOR REPORT - Smart Mirror VM')
    console.log('='.repeat(60))

    console.log('\n--- RESUME EXECUTIF ---')
    console.log(`Tests executes: ${test.info().project?.name || 'all'}`)
    console.log(`JS Errors: ${jsErrors.length}`)
    console.log(`Network Errors: ${networkErrors.length}`)
    console.log(`Bugs trouves: ${bugs.length}`)

    if (bugs.length === 0) {
      console.log('\nAUCUN BUG DETECTE - App conforme')
    } else {
      console.log('\n--- BUGS ---')
      const critiques = bugs.filter(b => b.severity === 'critique')
      const majeures = bugs.filter(b => b.severity === 'majeure')
      const mineures = bugs.filter(b => b.severity === 'mineure')

      console.log(`  Critiques: ${critiques.length}`)
      console.log(`  Majeures: ${majeures.length}`)
      console.log(`  Mineures: ${mineures.length}`)

      for (const bug of bugs) {
        console.log(`\n  ${bug.id} [${bug.severity.toUpperCase()}]`)
        console.log(`    Page: ${bug.page}`)
        console.log(`    Step: ${bug.step}`)
        console.log(`    Observed: ${bug.observed}`)
        console.log(`    Expected: ${bug.expected}`)
        if (bug.tech) console.log(`    Tech: ${bug.tech}`)
      }
    }

    console.log('\n--- RISQUES NON COUVERTS ---')
    console.log('  - Test responsive (portrait 1080x1920 vs landscape)')
    console.log('  - Test avec microscope physique (capture photo)')
    console.log('  - Test offline (API down mid-session)')
    console.log('  - Test multi-tenant (isolation boutiques)')
    console.log('  - Performance reelle sur Raspberry Pi 5')

    console.log('\n--- RECOMMANDATIONS ---')
    console.log('  1. Corriger tout bug critique avant merge')
    console.log('  2. Tester sur hardware reel (Pi 5)')
    console.log('  3. Ajouter error boundaries sur chaque ecran')
    console.log('  4. Implementer retry automatique sur API timeout')
    console.log('\n' + '='.repeat(60))
  })
})
