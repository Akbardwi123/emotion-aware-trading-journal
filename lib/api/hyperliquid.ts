// ====================================
// Hyperliquid API Client
// Mengambil data trade fills & funding rate dari Hyperliquid DEX
// Endpoint: https://api.hyperliquid.xyz/info (POST)
// Tidak membutuhkan API key
// ====================================

const HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info'

// ----- TYPE DEFINITIONS -----

export interface HyperliquidFill {
  coin: string           // Contoh: "ETH", "BTC"
  px: string             // Harga eksekusi (string karena presisi tinggi)
  sz: string             // Ukuran posisi
  side: 'B' | 'A'        // B = Buy (Long), A = Ask/Sell (Short)
  time: number           // Timestamp dalam milidetik
  startPosition: string  // Posisi sebelum fill
  dir: string            // Arah: "Open Long", "Close Long", "Open Short", "Close Short"
  closedPnl: string      // PnL jika posisi ditutup
  hash: string           // Transaction hash
  oid: number            // Order ID
  crossed: boolean       // Apakah ini taker order
  fee: string            // Trading fee yang dibayar
  tid: number            // Trade ID
  feeToken: string       // Token yang dipakai bayar fee
}

export interface HyperliquidFunding {
  time: number           // Timestamp
  coin: string           // Nama aset
  usdc: string           // Jumlah USDC yang dibayar/diterima
  szi: string            // Ukuran posisi saat funding
  fundingRate: string    // Funding rate saat itu
}

// ----- API FUNCTIONS -----

/**
 * Mengambil riwayat fill (eksekusi order) dari Hyperliquid
 * Mengembalikan hingga 500 fill terbaru
 */
export async function getUserFills(walletAddress: string): Promise<HyperliquidFill[]> {
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'userFills',
        user: walletAddress,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status}`)
    }

    const data = await response.json()
    return data as HyperliquidFill[]
  } catch (error) {
    console.error('[Hyperliquid] Failed to fetch user fills:', error)
    return []
  }
}

/**
 * Mengambil riwayat funding rate yang dibayar/diterima user
 * @param startTime - Timestamp awal dalam milidetik (wajib)
 * @param endTime - Timestamp akhir (opsional, default = sekarang)
 */
export async function getUserFunding(
  walletAddress: string,
  startTime: number,
  endTime?: number
): Promise<HyperliquidFunding[]> {
  try {
    const body: Record<string, unknown> = {
      type: 'userFunding',
      user: walletAddress,
      startTime,
    }
    if (endTime) body.endTime = endTime

    const response = await fetch(HYPERLIQUID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status}`)
    }

    const data = await response.json()
    return data as HyperliquidFunding[]
  } catch (error) {
    console.error('[Hyperliquid] Failed to fetch user funding:', error)
    return []
  }
}

/**
 * Mengambil semua fill secara rekursif (untuk akun dengan >500 trade)
 * Hyperliquid membatasi 500 item per request, jadi kita paginasi
 */
export async function getAllUserFills(walletAddress: string): Promise<HyperliquidFill[]> {
  const allFills: HyperliquidFill[] = []
  let hasMore = true
  let endTime: number | undefined = undefined

  while (hasMore) {
    const body: Record<string, unknown> = {
      type: 'userFillsByTime',
      user: walletAddress,
      startTime: 0,
    }
    if (endTime) body.endTime = endTime

    try {
      const response = await fetch(HYPERLIQUID_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = (await response.json()) as HyperliquidFill[]

      if (data.length === 0) {
        hasMore = false
      } else {
        allFills.push(...data)

        // Gunakan timestamp fill tertua sebagai endTime untuk request berikutnya
        const oldestTime = Math.min(...data.map((f) => f.time))
        endTime = oldestTime - 1 // -1 agar tidak duplikat

        // Jika kurang dari 500, berarti sudah habis
        if (data.length < 500) hasMore = false
      }
    } catch {
      hasMore = false
    }
  }

  // Urutkan dari yang terlama ke terbaru
  return allFills.sort((a, b) => a.time - b.time)
}
