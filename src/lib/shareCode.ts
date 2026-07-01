// 排除容易混淆嘅字符：0/O、1/I
export const SHARE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const SHARE_CODE_LENGTH = 6

export function generateShareCode(): string {
  let code = ''
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * SHARE_CODE_ALPHABET.length)
    code += SHARE_CODE_ALPHABET[index]
  }
  return code
}
