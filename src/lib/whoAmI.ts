import { localGet, localRemove, localSet } from './safeStorage'

const PREFIX = 'whoami:'

export function getWhoAmI(shareCode: string): string | null {
  return localGet(PREFIX + shareCode)
}

export function setWhoAmI(shareCode: string, memberId: string): void {
  localSet(PREFIX + shareCode, memberId)
}

export function clearWhoAmI(shareCode: string): void {
  localRemove(PREFIX + shareCode)
}
