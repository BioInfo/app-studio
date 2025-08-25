'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ArrowLeftRight, ArrowLeft, Calculator } from 'lucide-react'
import Link from 'next/link'

interface Unit {
  name: string
  symbol: string
  toBase: (value: number) => number
  fromBase: (value: number) => number
}

interface UnitCategory {
  name: string
  units: Record<string, Unit>
}

const UnitConverter = () => {
  const [selectedCategory, setSelectedCategory] = useState('length')
  const [fromUnit, setFromUnit] = useState('meter')
  const [toUnit, setToUnit] = useState('foot')
  const [inputValue, setInputValue] = useState('1')
  const [result, setResult] = useState('3.28084')

  const unitCategories: Record<string, UnitCategory> = useMemo(() => ({
    length: {
      name: 'Length',
      units: {
        meter: { name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
        kilometer: { name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        centimeter: { name: 'Centimeter', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        millimeter: { name: 'Millimeter', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        inch: { name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
        foot: { name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        yard: { name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
        mile: { name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
        nauticalMile: { name: 'Nautical Mile', symbol: 'nmi', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 }
      }
    },
    weight: {
      name: 'Weight',
      units: {
        kilogram: { name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
        gram: { name: 'Gram', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        pound: { name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
        ounce: { name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
        ton: { name: 'Metric Ton', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        stone: { name: 'Stone', symbol: 'st', toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 }
      }
    },
    temperature: {
      name: 'Temperature',
      units: {
        celsius: { 
          name: 'Celsius', 
          symbol: '°C', 
          toBase: (v) => v, 
          fromBase: (v) => v 
        },
        fahrenheit: { 
          name: 'Fahrenheit', 
          symbol: '°F', 
          toBase: (v) => (v - 32) * 5/9, 
          fromBase: (v) => v * 9/5 + 32 
        },
        kelvin: { 
          name: 'Kelvin', 
          symbol: 'K', 
          toBase: (v) => v - 273.15, 
          fromBase: (v) => v + 273.15 
        },
        rankine: { 
          name: 'Rankine', 
          symbol: '°R', 
          toBase: (v) => (v - 491.67) * 5/9, 
          fromBase: (v) => v * 9/5 + 491.67 
        }
      }
    },
    area: {
      name: 'Area',
      units: {
        squareMeter: { name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
        squareKilometer: { name: 'Square Kilometer', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
        squareCentimeter: { name: 'Square Centimeter', symbol: 'cm²', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
        squareInch: { name: 'Square Inch', symbol: 'in²', toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
        squareFoot: { name: 'Square Foot', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
        acre: { name: 'Acre', symbol: 'ac', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
        hectare: { name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 }
      }
    },
    volume: {
      name: 'Volume',
      units: {
        liter: { name: 'Liter', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
        milliliter: { name: 'Milliliter', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        gallon: { name: 'Gallon (US)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
        quart: { name: 'Quart (US)', symbol: 'qt', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
        pint: { name: 'Pint (US)', symbol: 'pt', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
        cup: { name: 'Cup (US)', symbol: 'cup', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
        fluidOunce: { name: 'Fluid Ounce (US)', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
        cubicMeter: { name: 'Cubic Meter', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 }
      }
    },
    speed: {
      name: 'Speed',
      units: {
        meterPerSecond: { name: 'Meter per Second', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
        kilometerPerHour: { name: 'Kilometer per Hour', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
        milePerHour: { name: 'Mile per Hour', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
        footPerSecond: { name: 'Foot per Second', symbol: 'ft/s', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        knot: { name: 'Knot', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 }
      }
    },
    energy: {
      name: 'Energy',
      units: {
        joule: { name: 'Joule', symbol: 'J', toBase: (v) => v, fromBase: (v) => v },
        kilojoule: { name: 'Kilojoule', symbol: 'kJ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        calorie: { name: 'Calorie', symbol: 'cal', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
        kilocalorie: { name: 'Kilocalorie', symbol: 'kcal', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
        wattHour: { name: 'Watt Hour', symbol: 'Wh', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
        kilowattHour: { name: 'Kilowatt Hour', symbol: 'kWh', toBase: (v) => v * 3600000, fromBase: (v) => v / 3600000 },
        btu: { name: 'British Thermal Unit', symbol: 'BTU', toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 }
      }
    }
  }), [])

  const convert = useCallback((value: number, fromUnitKey: string, toUnitKey: string, category: string) => {
    if (isNaN(value)) return 0
    
    const categoryData = unitCategories[category]
    if (!categoryData) return 0
    
    const fromUnitData = categoryData.units[fromUnitKey]
    const toUnitData = categoryData.units[toUnitKey]
    
    if (!fromUnitData || !toUnitData) return 0
    
    // Convert to base unit, then to target unit
    const baseValue = fromUnitData.toBase(value)
    return toUnitData.fromBase(baseValue)
  }, [unitCategories])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      const convertedValue = convert(numValue, fromUnit, toUnit, selectedCategory)
      setResult(convertedValue.toString())
    } else {
      setResult('')
    }
  }, [convert, fromUnit, toUnit, selectedCategory])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    const units = Object.keys(unitCategories[category].units)
    setFromUnit(units[0])
    setToUnit(units[1] || units[0])
    
    // Recalculate with new units
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      const convertedValue = convert(numValue, units[0], units[1] || units[0], category)
      setResult(convertedValue.toString())
    }
  }, [unitCategories, inputValue, convert])

  const handleFromUnitChange = useCallback((unit: string) => {
    setFromUnit(unit)
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      const convertedValue = convert(numValue, unit, toUnit, selectedCategory)
      setResult(convertedValue.toString())
    }
  }, [inputValue, toUnit, selectedCategory, convert])

  const handleToUnitChange = useCallback((unit: string) => {
    setToUnit(unit)
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      const convertedValue = convert(numValue, fromUnit, unit, selectedCategory)
      setResult(convertedValue.toString())
    }
  }, [inputValue, fromUnit, selectedCategory, convert])

  const swapUnits = useCallback(() => {
    const tempUnit = fromUnit
    setFromUnit(toUnit)
    setToUnit(tempUnit)
    
    // Swap values too
    setInputValue(result)
    setResult(inputValue)
  }, [fromUnit, toUnit, inputValue, result])

  const formatResult = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return ''
    
    // Format with appropriate precision
    if (Math.abs(num) >= 1000000) {
      return num.toExponential(6)
    } else if (Math.abs(num) < 0.001 && num !== 0) {
      return num.toExponential(6)
    } else {
      return num.toFixed(8).replace(/\.?0+$/, '')
    }
  }

  const currentCategory = unitCategories[selectedCategory]
  const fromUnitData = currentCategory.units[fromUnit]
  const toUnitData = currentCategory.units[toUnit]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Calculator className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Unit Converter</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Convert between different units of measurement. Supports length, weight, temperature, 
              area, volume, speed, and energy conversions.
            </p>
          </div>
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(unitCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === key
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Converter */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* From Unit */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <select
                  value={fromUnit}
                  onChange={(e) => handleFromUnitChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  {Object.entries(currentCategory.units).map(([key, unit]) => (
                    <option key={key} value={key}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter value"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-lg"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {fromUnitData?.name} ({fromUnitData?.symbol})
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapUnits}
                className="p-4 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors shadow-lg"
                title="Swap units"
              >
                <ArrowLeftRight className="w-6 h-6" />
              </button>
            </div>

            {/* To Unit */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <select
                  value={toUnit}
                  onChange={(e) => handleToUnitChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  {Object.entries(currentCategory.units).map(([key, unit]) => (
                    <option key={key} value={key}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg font-mono">
                  {formatResult(result) || '0'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {toUnitData?.name} ({toUnitData?.symbol})
                </div>
              </div>
            </div>
          </div>

          {/* Quick Conversions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Conversions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 10, 100].map((value) => {
                const convertedValue = convert(value, fromUnit, toUnit, selectedCategory)
                return (
                  <div key={value} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      {value} {fromUnitData?.symbol} =
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatResult(convertedValue.toString())} {toUnitData?.symbol}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Common Conversions Reference */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Common {currentCategory.name} Conversions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {selectedCategory === 'length' && (
              <>
                <div>1 meter = 3.28084 feet</div>
                <div>1 kilometer = 0.621371 miles</div>
                <div>1 inch = 2.54 centimeters</div>
                <div>1 yard = 0.9144 meters</div>
              </>
            )}
            {selectedCategory === 'weight' && (
              <>
                <div>1 kilogram = 2.20462 pounds</div>
                <div>1 pound = 16 ounces</div>
                <div>1 ton = 1000 kilograms</div>
                <div>1 stone = 14 pounds</div>
              </>
            )}
            {selectedCategory === 'temperature' && (
              <>
                <div>0°C = 32°F = 273.15K</div>
                <div>100°C = 212°F = 373.15K</div>
                <div>°F = (°C × 9/5) + 32</div>
                <div>°C = (°F - 32) × 5/9</div>
              </>
            )}
            {selectedCategory === 'volume' && (
              <>
                <div>1 liter = 0.264172 gallons (US)</div>
                <div>1 gallon (US) = 4 quarts</div>
                <div>1 cup = 8 fluid ounces</div>
                <div>1 cubic meter = 1000 liters</div>
              </>
            )}
            {selectedCategory === 'speed' && (
              <>
                <div>1 m/s = 3.6 km/h</div>
                <div>1 mph = 1.60934 km/h</div>
                <div>1 knot = 1.852 km/h</div>
                <div>1 km/h = 0.277778 m/s</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnitConverter