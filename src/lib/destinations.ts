export interface CashAdvice {
  legalNote: string
  suggestedLocalAmount: number
  currency: string
}

export interface DestinationInfo {
  countryName: string
  plugType: string
  voltage: string
  visaNote: string
  cashAdvice: CashAdvice
  mosquitoRisk: boolean
}

// 簽證欄假設用戶持香港特區護照（MVP 簡化，未做多本護照設定）。
export const DESTINATIONS: Record<string, DestinationInfo> = {
  JP: {
    countryName: '日本',
    plugType: 'A 型（兩腳扁插）',
    voltage: '100V',
    visaNote: '持香港特區護照免簽證，可逗留 90 日',
    cashAdvice: { legalNote: '攜帶超過 100 萬日圓現金需向海關申報', suggestedLocalAmount: 30000, currency: 'JPY' },
    mosquitoRisk: false,
  },
  TH: {
    countryName: '泰國',
    plugType: 'A/C 型（兩腳扁插或圓插）',
    voltage: '220V',
    visaNote: '持香港特區護照免簽證，可逗留 30 日',
    cashAdvice: { legalNote: '建議入境時身上備有至少 20,000 泰銖或等值外幣', suggestedLocalAmount: 5000, currency: 'THB' },
    mosquitoRisk: true,
  },
  KR: {
    countryName: '韓國',
    plugType: 'C/F 型（兩腳圓插）',
    voltage: '220V',
    visaNote: '持香港特區護照免簽證（需另外網上登記 K-ETA），可逗留 90 日',
    cashAdvice: { legalNote: '攜帶超過等值 1 萬美元現金需申報', suggestedLocalAmount: 100000, currency: 'KRW' },
    mosquitoRisk: false,
  },
  TW: {
    countryName: '台灣',
    plugType: 'A 型（兩腳扁插，同香港三腳插座唔同，記得帶轉換插）',
    voltage: '110V',
    visaNote: '持香港特區護照可辦落地簽或網上入境證，可逗留 30 日',
    cashAdvice: { legalNote: '攜帶超過等值 1 萬美元現金需申報', suggestedLocalAmount: 5000, currency: 'TWD' },
    mosquitoRisk: true,
  },
  VN: {
    countryName: '越南',
    plugType: 'A/C 型（兩腳扁插或圓插）',
    voltage: '220V',
    visaNote: '持香港特區護照免簽證，可逗留 30 日（出發前請留意最新規定）',
    cashAdvice: { legalNote: '攜帶超過等值 5,000 美元現金需申報', suggestedLocalAmount: 2000000, currency: 'VND' },
    mosquitoRisk: true,
  },
  HK: {
    countryName: '香港',
    plugType: 'G 型（三腳方插）',
    voltage: '220V',
    visaNote: '本地，免簽證資料',
    cashAdvice: { legalNote: '', suggestedLocalAmount: 0, currency: 'HKD' },
    mosquitoRisk: false,
  },
  SG: {
    countryName: '新加坡',
    plugType: 'G 型（三腳方插，同香港一樣，唔使帶轉換插）',
    voltage: '230V',
    visaNote: '持香港特區護照免簽證，可逗留 30 日',
    cashAdvice: {
      legalNote: '攜帶超過 20,000 新加坡元現金或等值可轉讓票據需申報',
      suggestedLocalAmount: 300,
      currency: 'SGD',
    },
    mosquitoRisk: true,
  },
  MY: {
    countryName: '馬來西亞',
    plugType: 'G 型（三腳方插，同香港一樣，唔使帶轉換插）',
    voltage: '240V',
    visaNote: '持香港特區護照免簽證，可逗留 90 日',
    cashAdvice: { legalNote: '攜帶超過等值 1 萬美元現金需申報', suggestedLocalAmount: 1500, currency: 'MYR' },
    mosquitoRisk: true,
  },
}

export function getDestination(countryCode: string): DestinationInfo | undefined {
  return DESTINATIONS[countryCode]
}
