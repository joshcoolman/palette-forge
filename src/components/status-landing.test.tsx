import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { appMeta } from '../app-meta'
import { StatusLanding } from './status-landing'

// Proof-of-life smoke test: the scaffold renders its status landing from
// app-meta. Identical across all three sibling repos; replaced with real
// behavior tests once the agent loop exists.
test('renders the app name heading and status', () => {
  render(<StatusLanding meta={appMeta} />)

  expect(
    screen.getByRole('heading', { name: new RegExp(appMeta.name, 'i') }),
  ).toBeTruthy()
  expect(screen.getByText(appMeta.status)).toBeTruthy()
})
