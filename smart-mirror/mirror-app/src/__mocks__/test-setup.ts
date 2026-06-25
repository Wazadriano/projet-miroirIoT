// Cle maitre deterministe pour la suite de tests : evite toute dependance au
// trousseau OS ou au FS, et garantit que cryptoVault est operationnel partout.
// 32 octets encodes en base64 (valeur arbitraire, reservee aux tests).
process.env.SMART_MIRROR_MASTER_KEY = Buffer.alloc(32, 7).toString('base64')
