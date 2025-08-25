'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Palette, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ColorValues {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  hsv: { h: number; s: number; v: number }
}

const ColorPicker = () => {
  const [currentColor, setCurrentColor] = useState<ColorValues>({
    hex: '#3B82F6',
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    hsv: { h: 217, s: 76, v: 96 }
  })
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('#3B82F6')
  const [colorHistory, setColorHistory] = useState<string[]>(['#3B82F6'])

  // Color conversion utilities
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }, [])

  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }, [])

  const rgbToHsl = useCallback((r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }, [])

  const hslToRgb = useCallback((h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360
    s /= 100
    l /= 100

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    let r, g, b

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }, [])

  const rgbToHsv = useCallback((r: number, g: number, b: number): { h: number; s: number; v: number } => {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min

    let h = 0
    const s = max === 0 ? 0 : diff / max
    const v = max

    if (diff !== 0) {
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break
        case g: h = (b - r) / diff + 2; break
        case b: h = (r - g) / diff + 4; break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    }
  }, [])

  const updateColor = useCallback((hex: string) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)

    const newColor: ColorValues = { hex, rgb, hsl, hsv }
    setCurrentColor(newColor)
    setInputValue(hex)

    // Add to history if not already present
    if (!colorHistory.includes(hex)) {
      setColorHistory(prev => [hex, ...prev.slice(0, 9)]) // Keep last 10 colors
    }
  }, [hexToRgb, rgbToHsl, rgbToHsv, colorHistory])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      updateColor(value)
    }
  }

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...currentColor.rgb, [component]: Math.max(0, Math.min(255, value)) }
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    updateColor(hex)
  }

  const handleHslChange = (component: 'h' | 's' | 'l', value: number) => {
    let newHsl = { ...currentColor.hsl }
    
    if (component === 'h') {
      newHsl.h = Math.max(0, Math.min(360, value))
    } else {
      newHsl[component] = Math.max(0, Math.min(100, value))
    }
    
    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l)
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    updateColor(hex)
  }

  const generateRandomColor = () => {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    updateColor(randomHex)
  }

  const handleCopy = async (format: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const colorFormats = useMemo(() => [
    { name: 'HEX', value: currentColor.hex.toUpperCase() },
    { name: 'RGB', value: `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})` },
    { name: 'HSL', value: `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)` },
    { name: 'HSV', value: `hsv(${currentColor.hsv.h}, ${currentColor.hsv.s}%, ${currentColor.hsv.v}%)` },
    { name: 'CSS RGB', value: `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})` },
    { name: 'CSS HSL', value: `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)` }
  ], [currentColor])

  const complementaryColor = useMemo(() => {
    const compHue = (currentColor.hsl.h + 180) % 360
    const rgb = hslToRgb(compHue, currentColor.hsl.s, currentColor.hsl.l)
    return rgbToHex(rgb.r, rgb.g, rgb.b)
  }, [currentColor.hsl, hslToRgb, rgbToHex])

  const analogousColors = useMemo(() => {
    return [-30, 30].map(offset => {
      const hue = (currentColor.hsl.h + offset + 360) % 360
      const rgb = hslToRgb(hue, currentColor.hsl.s, currentColor.hsl.l)
      return rgbToHex(rgb.r, rgb.g, rgb.b)
    })
  }, [currentColor.hsl, hslToRgb, rgbToHex])

  const triadicColors = useMemo(() => {
    return [120, 240].map(offset => {
      const hue = (currentColor.hsl.h + offset) % 360
      const rgb = hslToRgb(hue, currentColor.hsl.s, currentColor.hsl.l)
      return rgbToHex(rgb.r, rgb.g, rgb.b)
    })
  }, [currentColor.hsl, hslToRgb, rgbToHex])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Palette className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Color Picker</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Pick colors, convert between formats, and explore color harmonies. 
              Perfect for designers and developers working with colors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Color Display and Input */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Color</h2>
              
              {/* Large Color Display */}
              <div 
                className="w-full h-32 rounded-lg border-2 border-gray-200 mb-4 shadow-inner"
                style={{ backgroundColor: currentColor.hex }}
              ></div>

              {/* Color Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hex Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono"
                    placeholder="#000000"
                  />
                  <input
                    type="color"
                    value={currentColor.hex}
                    onChange={(e) => updateColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Random Color Button */}
              <button
                onClick={generateRandomColor}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Random Color
              </button>
            </div>

            {/* Color History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Colors</h2>
              <div className="grid grid-cols-5 gap-2">
                {colorHistory.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => updateColor(color)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-purple-400 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Color Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">RGB Controls</h2>
              
              {(['r', 'g', 'b'] as const).map((component) => (
                <div key={component} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {component.toUpperCase()}: {currentColor.rgb[component]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={currentColor.rgb[component]}
                    onChange={(e) => handleRgbChange(component, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">HSL Controls</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hue: {currentColor.hsl.h}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={currentColor.hsl.h}
                  onChange={(e) => handleHslChange('h', parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saturation: {currentColor.hsl.s}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentColor.hsl.s}
                  onChange={(e) => handleHslChange('s', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lightness: {currentColor.hsl.l}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentColor.hsl.l}
                  onChange={(e) => handleHslChange('l', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Color Formats and Harmonies */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Color Formats</h2>
              
              <div className="space-y-3">
                {colorFormats.map((format) => (
                  <div key={format.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{format.name}</div>
                      <div className="text-sm text-gray-600 font-mono">{format.value}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(format.name, format.value)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        copiedFormat === format.name
                          ? 'bg-green-600 text-white'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {copiedFormat === format.name ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Color Harmonies</h2>
              
              {/* Complementary */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Complementary</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateColor(currentColor.hex)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: currentColor.hex }}
                    title={currentColor.hex}
                  />
                  <button
                    onClick={() => updateColor(complementaryColor)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: complementaryColor }}
                    title={complementaryColor}
                  />
                </div>
              </div>

              {/* Analogous */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Analogous</h3>
                <div className="flex gap-2">
                  {analogousColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => updateColor(color)}
                      className="w-12 h-12 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <button
                    onClick={() => updateColor(currentColor.hex)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: currentColor.hex }}
                    title={currentColor.hex}
                  />
                </div>
              </div>

              {/* Triadic */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Triadic</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateColor(currentColor.hex)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: currentColor.hex }}
                    title={currentColor.hex}
                  />
                  {triadicColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => updateColor(color)}
                      className="w-12 h-12 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorPicker