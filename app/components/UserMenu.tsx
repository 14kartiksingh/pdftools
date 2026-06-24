"use client"

import { useState, useRef, useEffect } from "react"
import { signOut } from "next-auth/react"

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg border border-outline-variant hover:brightness-110 transition-all"
        aria-label="User Menu"
      >
        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface-container-high border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-outline-variant">
            <p className="font-title-md font-bold text-on-surface truncate">{user.name || "User"}</p>
            <p className="font-body-sm text-on-surface-variant truncate">{user.email || ""}</p>
          </div>
          <div className="p-2">
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left px-4 py-3 text-error hover:bg-error-container hover:text-on-error-container rounded font-label-md uppercase tracking-wide font-bold transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
