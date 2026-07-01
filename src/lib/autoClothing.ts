export interface AutoClothingItem {
  name: string
  qty: number
}

// 褲隔日著，數量 ÷2 進位；其餘衣物每日一件（spec §5.1）
export function autoClothingQuantities(dayCount: number): AutoClothingItem[] {
  return [
    { name: '上衣', qty: dayCount },
    { name: '褲', qty: Math.ceil(dayCount / 2) },
    { name: '內衣', qty: dayCount },
    { name: '襪', qty: dayCount },
  ]
}
