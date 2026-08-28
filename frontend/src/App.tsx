import { useEffect, useState } from 'react'

interface HealthResponse {
  status: string
  timestamp: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:5xxx/api/health') // <-- replace with your actual backend port
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch(() => setError('Could not connect to backend'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-2">A/L Maths AI Platform</h1>
        {error && <p className="text-red-500">{error}</p>}
        {health ? (
          <p className="text-green-600">
            Backend status: {health.status} ({health.timestamp})
          </p>
        ) : (
          !error && <p>Loading...</p>
        )}
      </div>
    </div>
  )
}

export default App