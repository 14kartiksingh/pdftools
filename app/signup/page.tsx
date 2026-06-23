"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface p-4">
      <div className="max-w-md w-full bg-surface-container p-8 rounded-xl border border-outline-variant shadow-2xl">
        <h1 className="font-display-lg text-display-lg mb-2 text-center">PDF Studio</h1>
        
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="font-title-lg text-title-lg mb-2">Success!</h2>
            <p className="text-on-surface-variant font-body-md mb-8">Account created successfully. Please sign in.</p>
            <button 
              onClick={() => router.push("/login")}
              className="w-full bg-primary-container text-on-primary-container font-bold uppercase tracking-wider p-3 rounded hover:brightness-110 transition-all"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <p className="text-on-surface-variant text-center mb-8 font-body-md">Create your account</p>
            
            {error && <div className="bg-error-container text-on-error-container p-3 rounded mb-4 text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold uppercase mb-1">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded p-3 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  required 
                />
              </div>
              <div>
                <label className="block text-label-md font-bold uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded p-3 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  required 
                />
              </div>
              <div>
                <label className="block text-label-md font-bold uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded p-3 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  required 
                  minLength={6}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-on-primary-container font-bold uppercase tracking-wider p-3 rounded hover:brightness-110 transition-all mt-4 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-6 text-center text-on-surface-variant text-body-md">
              Already have an account? <a href="/login" className="text-primary hover:underline font-bold">Sign In</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
