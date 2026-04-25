-- ====================================
-- EmoTrade: Database Schema
-- Jalankan di Supabase SQL Editor
-- ====================================

-- 1. TABEL USERS
-- Menyimpan data wallet user yang connect ke platform
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  telegram_chat_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan wallet
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users (wallet_address);

-- 2. TABEL ALERTS
-- Menyimpan log alert yang sudah dikirim ke Telegram
-- Digunakan cron job untuk menghindari pengiriman duplikat
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('FOMO', 'REVENGE', 'OVERLEVERAGE')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index untuk query: "apakah alert tipe X sudah dikirim ke user Y dalam 10 menit terakhir?"
CREATE INDEX IF NOT EXISTS idx_alerts_user_type_time ON alerts (user_id, type, sent_at DESC);

-- 3. TABEL BEHAVIOR_SCORES
-- Menyimpan skor perilaku mingguan setiap user
-- Digunakan untuk leaderboard dan tracking progress
CREATE TABLE IF NOT EXISTS behavior_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  fomo_count INTEGER DEFAULT 0,
  revenge_count INTEGER DEFAULT 0,
  overleverage_count INTEGER DEFAULT 0,
  week DATE NOT NULL,                -- Tanggal Senin minggu tsb
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Satu user hanya bisa punya 1 skor per minggu
  UNIQUE (user_id, week)
);

-- Index untuk leaderboard (urutkan by score DESC)
CREATE INDEX IF NOT EXISTS idx_behavior_scores_leaderboard ON behavior_scores (week, score DESC);

-- 4. ROW LEVEL SECURITY (RLS)
-- Wajib diaktifkan di Supabase untuk keamanan

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Siapa saja bisa membuat user baru (saat connect wallet)
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Policy: User hanya bisa lihat data sendiri
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true);

-- Policy: User hanya bisa update data sendiri
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (true);

-- Policy: Alerts bisa dibuat oleh server (via service role)
CREATE POLICY "Service can insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (true);

-- Policy: Alerts bisa dibaca
CREATE POLICY "Anyone can read alerts"
  ON alerts FOR SELECT
  USING (true);

-- Policy: Behavior scores bisa dibuat/update oleh server
CREATE POLICY "Service can upsert scores"
  ON behavior_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update scores"
  ON behavior_scores FOR UPDATE
  USING (true);

-- Policy: Semua orang bisa lihat leaderboard
CREATE POLICY "Anyone can read scores"
  ON behavior_scores FOR SELECT
  USING (true);

-- 5. AUTO-UPDATE updated_at
-- Trigger untuk otomatis update kolom updated_at

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_behavior_scores_updated_at
  BEFORE UPDATE ON behavior_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
