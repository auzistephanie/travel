// 第三方 API wrapper（*Api.ts）嘅 convention 係「失敗就靜默降級回 null/[]」（見 lib/README.md），
// 但完全唔出聲會令 quota 爆／key 過期／API 改版喺 dev 都隱形，debug 要靠逐條 network 睇。
// 呢度統一喺降級前留返一行 console.warn——唔改變任何行為，純遙測。
export function warnApiFailure(api: string, detail: unknown): void {
  console.warn(`[${api}] 呼叫失敗，已靜默降級`, detail)
}
