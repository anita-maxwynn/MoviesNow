import React, { useState, forwardRef } from "react"
import { Eye, EyeOff } from "lucide-react"

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const disabled =
      props.value === "" || props.value === undefined || props.disabled

    return (
      <div className="relative">
        {/* Password / Text input */}
        <input
          type={showPassword ? "text" : "password"}
          className={`hide-password-toggle w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-500 ${className}`}
          ref={ref}
          {...props}
        />

        {/* Toggle button */}
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={!!disabled}
        >
          {showPassword && !disabled ? (
            <Eye className="h-4 w-4" aria-hidden="true" />
          ) : (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </button>

        {/* Hide browser’s default password toggle */}
        <style>{`
          .hide-password-toggle::-ms-reveal,
          .hide-password-toggle::-ms-clear {
            visibility: hidden;
            pointer-events: none;
            display: none;
          }
        `}</style>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
