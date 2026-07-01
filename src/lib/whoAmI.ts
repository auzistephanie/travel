const PREFIX = 'whoami:'

export function getWhoAmI(shareCode: string): string | null {
  return localStorage.getItem(PREFIX + shareCode)
}

export function setWhoAmI(shareCode: string, memberId: string): void {
  localStorage.setItem(PREFIX + shareCode, memberId)
}
