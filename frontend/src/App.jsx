import React, { Suspense, lazy, useState, useEffect } from 'react'
import PaymentCallback from './components/PaymentCallback'

const BigApp = lazy(() => import('./BigApp'))

export default function App() {
  const [isPaymentCallback, setIsPaymentCallback] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    const search = window.location.search
    if (path.includes('/payment/callback') || (search.includes('reference=') && search.includes('NEX_SUB_'))) {
      setIsPaymentCallback(true)
    }
  }, [])

  if (isPaymentCallback) {
    return (
      <PaymentCallback
        onComplete={() => {
          setIsPaymentCallback(false)
          window.location.href = '/'
        }}
      />
    )
  }

  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', background: '#0a0d18' }}>Chargement de NexChat…</div>}>
      <BigApp />
    </Suspense>
  )
}
