'use client'

import React, { forwardRef, useId } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

/**
 * Enhanced Form Input Component
 *
 * A comprehensive input component with validation states, icons, and accessibility features.
 * Supports all standard input types plus password visibility toggle.
 *
 * @component
 * @example
 * ```tsx
 * <FormInput
 *   label="Email"
 *   type="email"
 *   placeholder="tu@email.com"
 *   error="Email inválido"
 *   helperText="Usaremos este email para contactarte"
 *   leftIcon={<Mail className="w-5 h-5" />}
 *   required
 * />
 * ```
 */

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      variant = 'default',
      type = 'text',
      className = '',
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const reactId = useId()
    const isPassword = type === 'password'
    const inputId = id || `input-${reactId}`

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    }

    const variantClasses = {
      default: 'bg-white/5 border-white/10 focus:border-primary-500 focus:bg-white/10',
      filled: 'bg-white/10 border-transparent focus:border-primary-500 focus:bg-white/15',
      outlined: 'bg-transparent border-white/20 focus:border-primary-500 focus:bg-white/5',
    }

    const inputClasses = `
      w-full rounded-lg border transition-all duration-200
      text-white placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-primary-500/20
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${leftIcon ? 'pl-11' : ''}
      ${rightIcon || isPassword ? 'pr-11' : ''}
      ${className}
    `

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={inputClasses}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {(rightIcon || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <div className="text-gray-400">{rightIcon}</div>
              )}
            </div>
          )}

          {/* Error Icon */}
          {error && !rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-400 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

/**
 * Textarea Component
 *
 * Enhanced textarea with the same features as FormInput.
 */

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  resize?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      resize = true,
      className = '',
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const reactId = useId()
    const textareaId = id || `textarea-${reactId}`

    const textareaClasses = `
      w-full px-4 py-2 rounded-lg border
      bg-white/5 border-white/10
      text-white placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white/10
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${!resize ? 'resize-none' : 'resize-y'}
      ${className}
    `

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-2 text-sm text-red-400 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="mt-2 text-sm text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
