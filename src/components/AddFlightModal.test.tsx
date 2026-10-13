import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddFlightModal } from './AddFlightModal'
import type { TripMember } from '../types/models'

const lookupFlightDetailed = vi.fn()
vi.mock('../lib/flightApi', () => ({
  lookupFlightDetailed: (...a: unknown[]) => lookupFlightDetailed(...a),
}))

const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true }]

describe('AddFlightModal', () => {
  beforeEach(() => {
    lookupFlightDetailed.mockReset()
  })

  it('prefills route fields from a successful lookup without saving yet', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    lookupFlightDetailed.mockResolvedValue({
      status: 'ok',
      value: {
        fromAirport: 'HKG',
        toAirport: 'NRT',
        fromTime: '2026-08-01T10:00:00Z',
        toTime: '2026-08-01T15:00:00Z',
        gate: 'A1',
        terminal: '1',
      },
    })

    render(<AddFlightModal members={members} onAdd={onAdd} onClose={() => {}} />)

    await user.type(screen.getByLabelText('航班號'), 'CX123')
    await user.type(screen.getByLabelText('日期'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: '查詢' }))

    expect(lookupFlightDetailed).toHaveBeenCalledWith('CX123', '2026-08-01')
    expect(await screen.findByDisplayValue('HKG')).toBeInTheDocument()
    expect(screen.getByDisplayValue('NRT')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('shows a hint instead of an error when lookup finds nothing', async () => {
    const user = userEvent.setup()
    lookupFlightDetailed.mockResolvedValue({ status: 'empty' })

    render(<AddFlightModal members={members} onAdd={vi.fn()} onClose={() => {}} />)

    await user.type(screen.getByLabelText('航班號'), 'ZZ999')
    await user.type(screen.getByLabelText('日期'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: '查詢' }))

    expect(await screen.findByText('查不到，請手動輸入')).toBeInTheDocument()
  })

  it('explains when the flight database is not configured', async () => {
    const user = userEvent.setup()
    lookupFlightDetailed.mockResolvedValue({ status: 'unconfigured' })

    render(<AddFlightModal members={members} onAdd={vi.fn()} onClose={() => {}} />)

    await user.type(screen.getByLabelText('航班號'), 'CX123')
    await user.type(screen.getByLabelText('日期'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: '查詢' }))

    expect(await screen.findByText('航班資料庫未設定，請手動輸入')).toBeInTheDocument()
  })

  it('saves the manually entered flight and closes on confirm', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue({ id: 'f1' })
    const onClose = vi.fn()

    render(<AddFlightModal members={members} onAdd={onAdd} onClose={onClose} />)

    await user.type(screen.getByLabelText('航班號'), 'CX123')
    await user.type(screen.getByLabelText('日期'), '2026-08-01')
    await user.type(screen.getByLabelText('出發機場'), 'HKG')
    await user.type(screen.getByLabelText('到達機場'), 'NRT')
    await user.type(screen.getByLabelText('出發時間'), '2026-08-01T10:00')
    await user.type(screen.getByLabelText('到達時間'), '2026-08-01T15:00')
    await user.click(screen.getByRole('button', { name: '加入航班' }))

    expect(onAdd).toHaveBeenCalledWith({
      code: 'CX123',
      date: '2026-08-01',
      fromAirport: 'HKG',
      toAirport: 'NRT',
      fromTime: '2026-08-01T10:00',
      toTime: '2026-08-01T15:00',
      gate: null,
      terminal: null,
      seat: null,
      pnr: null,
      baggageKg: null,
      memberId: null,
    })
    expect(onClose).toHaveBeenCalled()
  })
})
