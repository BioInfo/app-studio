'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Upload, Download, RotateCcw, ArrowLeft, Image as ImageIcon, Maximize2 } from 'lucide-react'
import Link from 'next/link'

interface ImageData {
  file: File
  url: string
  width: number
  height: number
  aspectRatio: number
}

interface ResizeOptions {
  width: number
  height: number
  maintainAspectRatio: boolean
  quality: number
  format: 'jpeg' | 'png' | 'webp'
}

const ImageResizer = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null)
  const [resizedImageUrl, setResizedImageUrl] = useState<string | null>(null)
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>({
    width: 800,
    height: 600,
    maintainAspectRatio: true,
    quality: 0.9,
    format: 'jpeg'
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    
    img.onload = () => {
      const imageData: ImageData = {
        file,
        url,
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      }
      
      setOriginalImage(imageData)
      setResizeOptions(prev => ({
        ...prev,
        width: img.width,
        height: img.height
      }))
      setResizedImageUrl(null)
    }
    
    img.src = url
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const updateDimensions = useCallback((width: number, height: number, maintainRatio: boolean = resizeOptions.maintainAspectRatio) => {
    if (!originalImage) return

    if (maintainRatio) {
      const aspectRatio = originalImage.aspectRatio
      setResizeOptions(prev => ({
        ...prev,
        width: Math.round(width),
        height: Math.round(width / aspectRatio),
        maintainAspectRatio: maintainRatio
      }))
    } else {
      setResizeOptions(prev => ({
        ...prev,
        width: Math.round(width),
        height: Math.round(height),
        maintainAspectRatio: maintainRatio
      }))
    }
  }, [originalImage, resizeOptions.maintainAspectRatio])

  const resizeImage = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = resizeOptions.width
      canvas.height = resizeOptions.height

      const img = new Image()
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, resizeOptions.width, resizeOptions.height)
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            setResizedImageUrl(url)
          }
          setIsProcessing(false)
        }, `image/${resizeOptions.format}`, resizeOptions.quality)
      }
      
      img.src = originalImage.url
    } catch (error) {
      console.error('Error resizing image:', error)
      setIsProcessing(false)
    }
  }, [originalImage, resizeOptions])

  const downloadResizedImage = useCallback(() => {
    if (!resizedImageUrl || !originalImage) return

    const link = document.createElement('a')
    link.href = resizedImageUrl
    const fileName = originalImage.file.name.replace(/\.[^/.]+$/, '')
    link.download = `${fileName}_resized_${resizeOptions.width}x${resizeOptions.height}.${resizeOptions.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [resizedImageUrl, originalImage, resizeOptions])

  const resetImage = useCallback(() => {
    setOriginalImage(null)
    setResizedImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const presetSizes = [
    { name: 'Instagram Square', width: 1080, height: 1080 },
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'Facebook Cover', width: 1200, height: 630 },
    { name: 'Twitter Header', width: 1500, height: 500 },
    { name: 'YouTube Thumbnail', width: 1280, height: 720 },
    { name: 'HD (720p)', width: 1280, height: 720 },
    { name: 'Full HD (1080p)', width: 1920, height: 1080 },
    { name: 'Profile Picture', width: 400, height: 400 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ImageIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Image Resizer</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Resize images for web, social media, or print. Maintain aspect ratios, 
              adjust quality, and convert between formats.
            </p>
          </div>
        </div>

        {/* Upload Area */}
        {!originalImage && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Drop your image here
              </h3>
              <p className="text-gray-500 mb-4">
                or click to browse files
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-sm text-gray-400 mt-4">
                Supports JPEG, PNG, WebP, and other image formats
              </p>
            </div>
          </div>
        )}

        {/* Image Processing Interface */}
        {originalImage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Original Image */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Original Image</h2>
                <button
                  onClick={resetImage}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <img
                  src={originalImage.url}
                  alt="Original"
                  className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                />
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>Size: {originalImage.width} × {originalImage.height}</div>
                <div>File: {originalImage.file.name}</div>
                <div>Size: {(originalImage.file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>

            {/* Resize Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Resize Options</h2>
              
              {/* Dimensions */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={resizeOptions.width}
                      onChange={(e) => updateDimensions(parseInt(e.target.value), resizeOptions.height)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={resizeOptions.height}
                      onChange={(e) => updateDimensions(resizeOptions.width, parseInt(e.target.value), false)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      disabled={resizeOptions.maintainAspectRatio}
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={resizeOptions.maintainAspectRatio}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Maintain aspect ratio</span>
                </label>
              </div>

              {/* Preset Sizes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preset Sizes
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {presetSizes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updateDimensions(preset.width, preset.height, false)}
                      className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {preset.name} ({preset.width} × {preset.height})
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {Math.round(resizeOptions.quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={resizeOptions.quality}
                  onChange={(e) => setResizeOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Format */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={resizeOptions.format}
                  onChange={(e) => setResizeOptions(prev => ({ ...prev, format: e.target.value as 'jpeg' | 'png' | 'webp' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              {/* Resize Button */}
              <button
                onClick={resizeImage}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isProcessing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Resize Image'}
              </button>
            </div>

            {/* Resized Image */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Resized Image</h2>
                {resizedImageUrl && (
                  <button
                    onClick={downloadResizedImage}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
              
              <div className="mb-4">
                {resizedImageUrl ? (
                  <img
                    src={resizedImageUrl}
                    alt="Resized"
                    className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                    Resized image will appear here
                  </div>
                )}
              </div>
              
              {resizedImageUrl && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Size: {resizeOptions.width} × {resizeOptions.height}</div>
                  <div>Format: {resizeOptions.format.toUpperCase()}</div>
                  <div>Quality: {Math.round(resizeOptions.quality * 100)}%</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

export default ImageResizer