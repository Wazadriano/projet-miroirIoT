export const app = {
  getVersion: () => '0.1.0',
  getPath: (name: string) => `/tmp/smart-mirror-test/${name}`,
  getName: () => 'smart-mirror',
  isReady: () => true
}

export const safeStorage = {
  isEncryptionAvailable: () => false,
  encryptString: (str: string) => Buffer.from(str),
  decryptString: (buf: Buffer) => buf.toString()
}

export const ipcMain = {
  handle: () => {},
  on: () => {}
}

export default { app, safeStorage, ipcMain }
