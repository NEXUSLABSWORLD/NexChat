import React, { Suspense, lazy } from 'react'

const BigApp = lazy(() => import('./BigApp'))

export default function App() {
  return (
    <Suspense fallback={<div>Chargement…</div>}>
      <BigApp />
    </Suspense>
  )
}
