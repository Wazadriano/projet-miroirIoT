function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, key) => {
    if (o && typeof o === 'object') return (o as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce<Record<string, unknown>>((o, key) => {
    if (!(key in o) || typeof o[key] !== 'object') o[key] = {}
    return o[key] as Record<string, unknown>
  }, obj)
  target[last] = value
}

export default class MockStore<T extends Record<string, unknown>> {
  private data: Record<string, unknown>

  constructor(opts?: { name?: string; defaults?: T }) {
    this.data = JSON.parse(JSON.stringify(opts?.defaults || {}))
  }

  get(key: string): unknown {
    return getNestedValue(this.data, key)
  }

  set(key: string, value: unknown): void
  set(obj: Record<string, unknown>): void
  set(keyOrObj: string | Record<string, unknown>, value?: unknown): void {
    if (typeof keyOrObj === 'string') {
      setNestedValue(this.data, keyOrObj, value)
    } else {
      Object.assign(this.data, keyOrObj)
    }
  }

  get store(): T {
    return JSON.parse(JSON.stringify(this.data)) as T
  }

  clear(): void {
    this.data = {}
  }
}
