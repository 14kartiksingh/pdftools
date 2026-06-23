"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError(res.error)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface p-4">
      <div className="max-w-md w-full bg-surface-container p-8 rounded-xl border border-outline-variant shadow-2xl">
        <h1 className="font-display-lg text-display-lg mb-2 text-center">PDF Studio</h1>
        <p className="text-on-surface-variant text-center mb-8 font-body-md">Sign in to your account</p>
        
        {error && <div className="bg-error-container text-on-error-container p-3 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-primary-container text-on-primary-container font-bold uppercase tracking-wider p-3 rounded hover:brightness-110 transition-all mt-4"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-on-surface-variant text-body-md">
          Don't have an account? <a href="/signup" className="text-primary hover:underline font-bold">Sign Up</a>
        </p>
      </div>
    </div>
  )
}
