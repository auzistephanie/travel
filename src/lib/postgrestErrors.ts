// Postgres error codes（經 Supabase PostgREST 回傳嘅 error.code）。
// 以前 tripApi / itineraryRepo / packingRepo 各自定義一次 '23505'，而家共用呢度一份。
// 23505 = unique_violation：撞咗 unique constraint（share code 撞碼、
// StrictMode 雙重 effect 同時 insert 同一行等），caller 通常用嚟決定 retry 或者讀返 existing。
export const UNIQUE_VIOLATION = '23505'
