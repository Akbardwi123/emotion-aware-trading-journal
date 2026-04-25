// ====================================
// Telegram Bot API Client
// Mengirim pesan peringatan (alert) ke user via Telegram
// Cara setup:
//   1. Buka Telegram, cari @BotFather
//   2. Ketik /newbot, ikuti instruksi
//   3. Simpan token ke .env.local (TELEGRAM_BOT_TOKEN)
//   4. User harus /start bot lalu kirim pesan apa saja
//   5. Ambil chat_id dari getUpdates atau user register sendiri
// ====================================

const TELEGRAM_API = 'https://api.telegram.org/bot'

/**
 * Mengirim pesan teks ke user via Telegram
 * @param chatId - Chat ID Telegram user (didapat saat mereka /start bot)
 * @param message - Pesan yang akan dikirim (mendukung HTML formatting)
 */
export async function sendTelegramMessage(
  chatId: string,
  message: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token || token === 'masukkan_bot_token_telegram_anda') {
    console.warn('[Telegram] Bot token not configured. Skipping alert.')
    return false
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('[Telegram] Failed to send message:', data.description)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram] Error sending message:', error)
    return false
  }
}

/**
 * Mengambil update terbaru dari bot (untuk mendapatkan chat_id user baru)
 * User harus mengirim /start atau pesan apa saja ke bot terlebih dahulu
 */
export async function getTelegramUpdates(): Promise<
  Array<{ chatId: string; username: string; text: string }>
> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return []

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/getUpdates`)
    const data = await response.json()

    if (!data.ok || !data.result) return []

    return data.result
      .filter((update: Record<string, unknown>) => update.message)
      .map((update: { message: { chat: { id: number; username?: string }; text?: string } }) => ({
        chatId: String(update.message.chat.id),
        username: update.message.chat.username || 'unknown',
        text: update.message.text || '',
      }))
  } catch {
    return []
  }
}

// ====================================
// TEMPLATE PESAN ALERT
// Pesan-pesan yang dikirim ke user saat perilaku terdeteksi
// ====================================

export function buildFomoAlert(coin: string, priceChange: number): string {
  return [
    '🚨 <b>FOMO Alert Detected!</b>',
    '',
    `Anda baru saja masuk posisi <b>${coin}</b> setelah harga bergerak <b>${priceChange.toFixed(1)}%</b> dalam 1 jam terakhir.`,
    '',
    '💡 <i>Tip: Harga yang sudah naik/turun tajam seringkali akan koreksi. Pastikan Anda punya thesis yang jelas, bukan hanya ikut-ikutan.</i>',
    '',
    '📊 Lihat dashboard → emotrade.app/dashboard',
  ].join('\n')
}

export function buildRevengeAlert(
  coin: string,
  lossAmount: number,
  minutesAfter: number,
  sizeMultiplier: number
): string {
  return [
    '🔥 <b>Revenge Trading Detected!</b>',
    '',
    `Anda baru saja loss <b>$${lossAmount.toFixed(2)}</b>, lalu membuka posisi <b>${coin}</b> hanya <b>${minutesAfter} menit</b> kemudian dengan size <b>${sizeMultiplier.toFixed(1)}x</b> lebih besar.`,
    '',
    '⛔ <i>STOP! Ambil napas 15 menit. Revenge trading adalah penyebab #1 kerugian besar.</i>',
    '',
    '🧘 Istirahat sejenak. Buka kembali chart dengan kepala dingin.',
  ].join('\n')
}

export function buildOverleverageAlert(
  coin: string,
  leverageRatio: number,
  notional: number,
  balance: number
): string {
  return [
    '💀 <b>Overleveraging Warning!</b>',
    '',
    `Posisi <b>${coin}</b> Anda senilai <b>$${notional.toFixed(0)}</b> = <b>${leverageRatio.toFixed(1)}x</b> dari saldo Anda ($${balance.toFixed(0)}).`,
    '',
    '⚠️ <i>Risiko likuidasi sangat tinggi. Pertimbangkan untuk mengurangi ukuran posisi.</i>',
  ].join('\n')
}

export function buildWeeklyDigest(
  score: number,
  totalPnl: number,
  winRate: number,
  fomoCount: number,
  revengeCount: number
): string {
  const scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🔵' : score >= 40 ? '🟡' : '🔴'
  const pnlEmoji = totalPnl >= 0 ? '📈' : '📉'

  return [
    '📋 <b>Weekly Trading Report</b>',
    '━━━━━━━━━━━━━━━━━━━',
    '',
    `${scoreEmoji} Behavior Score: <b>${score}/100</b>`,
    `${pnlEmoji} True PnL: <b>${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}</b>`,
    `🎯 Win Rate: <b>${winRate.toFixed(0)}%</b>`,
    '',
    '<b>Behavior Summary:</b>',
    `  ⚠️ FOMO: ${fomoCount}x`,
    `  🔥 Revenge: ${revengeCount}x`,
    '',
    score >= 80
      ? '✨ <i>Excellent! Anda trading dengan disiplin minggu ini.</i>'
      : score >= 60
      ? '💪 <i>Good job. Masih ada ruang untuk improvement.</i>'
      : '🚨 <i>Perlu perhatian serius pada pola trading Anda.</i>',
    '',
    '📊 Detail → emotrade.app/dashboard',
  ].join('\n')
}
