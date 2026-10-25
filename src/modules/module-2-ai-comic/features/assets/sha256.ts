/**
 * 文件说明：模块 2 SHA-256 摘要工具。
 * 职责：优先使用浏览器 crypto.subtle 计算二进制摘要；在 http 等非安全上下文中 crypto.subtle 不可用时，使用本文件内的纯 JS 实现兜底，两者输出一致的 64 位小写十六进制。
 * 更新触发：摘要算法、输出格式或兜底实现变化时，需要同步更新本文件与测试向量回归测试。
 *
 * SHA-256 只用于内容去重与完整性核对，不代表作者身份或教师认证。
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

function toHex(words: Uint32Array): string {
  return Array.from(words, word => word.toString(16).padStart(8, "0")).join("")
}

/** 纯 JS SHA-256（FIPS 180-4），按 64 字节分块流式处理，不复制整段输入。 */
export function sha256HexFallback(data: Uint8Array): string {
  const hash = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const w = new Uint32Array(64)

  const processBlock = (block: Uint8Array, offset: number) => {
    for (let i = 0; i < 16; i += 1) {
      const j = offset + i * 4
      w[i] = ((block[j] << 24) | (block[j + 1] << 16) | (block[j + 2] << 8) | block[j + 3]) >>> 0
    }
    for (let i = 16; i < 64; i += 1) {
      const x = w[i - 15], y = w[i - 2]
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7]
    for (let i = 0; i < 64; i += 1) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) >>> 0
      h = g; g = f; f = e; e = (d + t1) >>> 0
      d = c; c = b; b = a; a = (t1 + t2) >>> 0
    }
    hash[0] = (hash[0] + a) >>> 0; hash[1] = (hash[1] + b) >>> 0
    hash[2] = (hash[2] + c) >>> 0; hash[3] = (hash[3] + d) >>> 0
    hash[4] = (hash[4] + e) >>> 0; hash[5] = (hash[5] + f) >>> 0
    hash[6] = (hash[6] + g) >>> 0; hash[7] = (hash[7] + h) >>> 0
  }

  const fullBlocks = Math.floor(data.length / 64)
  for (let i = 0; i < fullBlocks; i += 1) processBlock(data, i * 64)

  // 尾块：剩余字节 + 0x80 + 补零 + 64 位比特长度
  const remaining = data.length - fullBlocks * 64
  const tail = new Uint8Array(remaining < 56 ? 64 : 128)
  tail.set(data.subarray(fullBlocks * 64))
  tail[remaining] = 0x80
  const bitLength = data.length * 8
  const view = new DataView(tail.buffer)
  view.setUint32(tail.length - 8, Math.floor(bitLength / 0x100000000))
  view.setUint32(tail.length - 4, bitLength >>> 0)
  for (let offset = 0; offset < tail.length; offset += 64) processBlock(tail, offset)

  return toHex(hash)
}

/** 计算摘要：crypto.subtle 可用时用它，不可用或失败时用纯 JS 兜底。 */
export async function sha256Hex(data: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    try {
      const digest = await subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>)
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")
    } catch (error) {
      // 部分环境 subtle 存在但拒绝执行，转用兜底实现
      console.warn("[module2 sha256] crypto.subtle 不可用，改用纯 JS 实现", error)
    }
  }
  return sha256HexFallback(data)
}
