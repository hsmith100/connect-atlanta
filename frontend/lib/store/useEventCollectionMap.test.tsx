import React from 'react'
import { render, screen } from '@testing-library/react'
import { useEventCollectionMap } from './useEventCollectionMap'
import { getPublicCollections } from '../api/store'

jest.mock('../api/store')

function Probe() {
  return <pre data-testid="map">{JSON.stringify(useEventCollectionMap())}</pre>
}

beforeEach(() => jest.resetAllMocks())

it('maps each event to its collection', async () => {
  jest.mocked(getPublicCollections).mockResolvedValue([
    { id: 'c1', eventId: 'e1' }, { id: 'c2', eventId: 'e2' },
  ] as never)
  render(<Probe />)
  expect(await screen.findByText('{"e1":"c1","e2":"c2"}')).toBeInTheDocument()
})

it('stays empty when the request fails', async () => {
  jest.mocked(getPublicCollections).mockRejectedValue(new Error('HTTP 500'))
  render(<Probe />)
  await Promise.resolve()
  expect(screen.getByTestId('map')).toHaveTextContent('{}')
})
