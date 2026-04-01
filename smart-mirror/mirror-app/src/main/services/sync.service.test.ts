import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => '[]'),
  readdirSync: vi.fn(() => []),
  statSync: vi.fn(() => ({ mtimeMs: Date.now() })),
  unlinkSync: vi.fn()
}))

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { SyncService } from './sync.service'
import { ConfigService } from './config.service'
import { ApiClientService } from './api-client.service'

describe('SyncService', () => {
  let syncService: SyncService
  let config: ConfigService
  let api: ApiClientService

  beforeEach(() => {
    vi.clearAllMocks()

    config = new ConfigService()
    api = new ApiClientService(config)
    syncService = new SyncService(config, api)
  })

  describe('getQueueSize', () => {
    it('should return 0 when queue file does not exist', () => {
      ;(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false)

      expect(syncService.getQueueSize()).toBe(0)
    })

    it('should return count of items in queue', () => {
      ;(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true)
      ;(readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          { localPath: '/tmp/1.jpg', seanceId: 's1', phase: 'avant', createdAt: '2026-01-01' },
          { localPath: '/tmp/2.jpg', seanceId: 's1', phase: 'apres', createdAt: '2026-01-01' }
        ])
      )

      expect(syncService.getQueueSize()).toBe(2)
    })

    it('should return 0 if queue file is corrupted', () => {
      ;(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true)
      ;(readFileSync as ReturnType<typeof vi.fn>).mockReturnValue('not json')

      expect(syncService.getQueueSize()).toBe(0)
    })
  })

  describe('savePhotoLocally', () => {
    it('should write file and add to sync queue', () => {
      const photoData = Buffer.from('fake-jpg-data')

      ;(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false)
      ;(writeFileSync as ReturnType<typeof vi.fn>).mockImplementation(() => {})
      ;(readFileSync as ReturnType<typeof vi.fn>).mockReturnValue('[]')

      const path = syncService.savePhotoLocally(photoData, 'seance-1', 'avant')

      expect(path).toMatch(/avant\.jpg$/)
      expect(writeFileSync).toHaveBeenCalled()
    })

    it('should fallback to dev directory on permission error', () => {
      const photoData = Buffer.from('fake-jpg-data')

      ;(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false)
      ;(writeFileSync as ReturnType<typeof vi.fn>)
        .mockImplementationOnce(() => { throw new Error('EACCES') })
        .mockImplementation(() => {})
      ;(readFileSync as ReturnType<typeof vi.fn>).mockReturnValue('[]')

      const path = syncService.savePhotoLocally(photoData, 'seance-1', 'apres')

      expect(path).toContain('.smart-mirror-photos')
      expect(path).toMatch(/apres\.jpg$/)
    })
  })

  describe('stop', () => {
    it('should clear intervals without error', () => {
      syncService.startPeriodicSync()
      syncService.stop()
      // No error thrown
    })

    it('should be safe to call stop without starting', () => {
      syncService.stop()
      // No error thrown
    })
  })
})
