// components/property/FloorLevelSelector.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { IFloorLevel, ISingleFloorLevel, IComplexFloorLevel } from '@/types/properties';

interface FloorLevelSelectorProps {
  value: IFloorLevel;
  onChange: (floorLevel: IFloorLevel) => void;
  error?: string;
}

type FloorType = 'basement' | 'ground' | 'floor' | 'mezzanine' | 'rooftop';

export const FloorLevelSelector: React.FC<FloorLevelSelectorProps> = ({
  value,
  onChange,
  error
}) => {
  // State for the UI mode selection
  const [mode, setMode] = useState<'single' | 'complex'>(value.type);
  
  // Single mode state
  const [singleFloorType, setSingleFloorType] = useState<FloorType>('ground');
  const [singleFloorNumber, setSingleFloorNumber] = useState<number>(1);
  
  // Complex mode state
  const [complexData, setComplexData] = useState<Omit<IComplexFloorLevel, 'type'>>({
    basements: 0,
    hasGroundFloor: true,
    floors: 0,
    mezzanines: 0,
    hasRooftop: false
  });

  // Helper function to encode single floor values
  const encodeFloorValue = (type: FloorType, number: number): number => {
    switch (type) {
      case 'basement':
        return -number; // B1=-1, B2=-2, etc.
      case 'ground':
        return 0; // G=0
      case 'floor':
        return number; // Floor 1=1, Floor 2=2, etc.
      case 'mezzanine':
        return 1000 + number; // M1=1001, M2=1002, etc.
      case 'rooftop':
        return 2000 + number; // R1=2001, R2=2002, etc.
      default:
        return 0;
    }
  };

  // Helper function to decode single floor values
  const decodeFloorValue = (encodedValue: number): { type: FloorType; number: number } => {
    if (encodedValue < 0) {
      return { type: 'basement', number: Math.abs(encodedValue) };
    } else if (encodedValue === 0) {
      return { type: 'ground', number: 0 };
    } else if (encodedValue >= 2000) {
      return { type: 'rooftop', number: encodedValue - 2000 };
    } else if (encodedValue >= 1000) {
      return { type: 'mezzanine', number: encodedValue - 1000 };
    } else {
      return { type: 'floor', number: encodedValue };
    }
  };

  // Initialize component state based on props value
  useEffect(() => {
    if (value.type === 'single') {
      const decoded = decodeFloorValue(value.value);
      setSingleFloorType(decoded.type);
      setSingleFloorNumber(decoded.number > 0 ? decoded.number : 1);
    } else if (value.type === 'complex') {
      setComplexData({
        basements: value.basements,
        hasGroundFloor: value.hasGroundFloor,
        floors: value.floors,
        mezzanines: value.mezzanines,
        hasRooftop: value.hasRooftop
      });
    }
  }, [value]);

  // Handle mode change
  const handleModeChange = (newMode: 'single' | 'complex') => {
    setMode(newMode);
    
    if (newMode === 'single') {
      // Default to ground floor
      const encodedValue = encodeFloorValue('ground', 0);
      const newSingleFloor: ISingleFloorLevel = {
        type: 'single',
        value: encodedValue
      };
      setSingleFloorType('ground');
      setSingleFloorNumber(1);
      onChange(newSingleFloor);
    } else {
      // Default complex floor structure
      const newComplexFloor: IComplexFloorLevel = {
        type: 'complex',
        basements: 0,
        hasGroundFloor: true,
        floors: 0,
        mezzanines: 0,
        hasRooftop: false
      };
      setComplexData(newComplexFloor);
      onChange(newComplexFloor);
    }
  };

  // Handle single floor changes
  const handleSingleFloorChange = (type: FloorType, number?: number) => {
    const finalNumber = number !== undefined ? number : (type === 'ground' ? 0 : singleFloorNumber);
    const encodedValue = encodeFloorValue(type, finalNumber);
    
    setSingleFloorType(type);
    if (number !== undefined) setSingleFloorNumber(number);
    
    const newSingleFloor: ISingleFloorLevel = {
      type: 'single',
      value: encodedValue
    };
    onChange(newSingleFloor);
  };

  // Handle complex floor changes
  const handleComplexFloorChange = (field: keyof Omit<IComplexFloorLevel, 'type'>, value: number | boolean) => {
    const newComplexData = { ...complexData, [field]: value };
    setComplexData(newComplexData);
    
    const newComplexFloor: IComplexFloorLevel = {
      type: 'complex',
      ...newComplexData
    };
    onChange(newComplexFloor);
  };

  const renderSingleFloorInputs = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Select Floor Level</h4>
      
      <div className="grid grid-cols-1 gap-3">
        {/* Basement */}
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="floor-basement"
            name="floorType"
            checked={singleFloorType === 'basement'}
            onChange={() => handleSingleFloorChange('basement')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="floor-basement" className="flex items-center space-x-2">
            <span className="text-sm font-medium">Basement</span>
            {singleFloorType === 'basement' && (
              <div className="flex items-center space-x-1">
                <span className="text-sm">B</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={singleFloorNumber}
                  onChange={(e) => handleSingleFloorChange('basement', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </label>
        </div>

        {/* Ground */}
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="floor-ground"
            name="floorType"
            checked={singleFloorType === 'ground'}
            onChange={() => handleSingleFloorChange('ground', 0)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="floor-ground" className="text-sm font-medium">
            Ground Floor (G)
          </label>
        </div>

        {/* Regular Floor */}
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="floor-regular"
            name="floorType"
            checked={singleFloorType === 'floor'}
            onChange={() => handleSingleFloorChange('floor')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="floor-regular" className="flex items-center space-x-2">
            <span className="text-sm font-medium">Floor</span>
            {singleFloorType === 'floor' && (
              <input
                type="number"
                min="1"
                max="200"
                value={singleFloorNumber}
                onChange={(e) => handleSingleFloorChange('floor', parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </label>
        </div>

        {/* Mezzanine */}
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="floor-mezzanine"
            name="floorType"
            checked={singleFloorType === 'mezzanine'}
            onChange={() => handleSingleFloorChange('mezzanine')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="floor-mezzanine" className="flex items-center space-x-2">
            <span className="text-sm font-medium">Mezzanine</span>
            {singleFloorType === 'mezzanine' && (
              <div className="flex items-center space-x-1">
                <span className="text-sm">M</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={singleFloorNumber}
                  onChange={(e) => handleSingleFloorChange('mezzanine', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </label>
        </div>

        {/* Rooftop */}
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="floor-rooftop"
            name="floorType"
            checked={singleFloorType === 'rooftop'}
            onChange={() => handleSingleFloorChange('rooftop')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="floor-rooftop" className="flex items-center space-x-2">
            <span className="text-sm font-medium">Rooftop</span>
            {singleFloorType === 'rooftop' && (
              <div className="flex items-center space-x-1">
                <span className="text-sm">R</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={singleFloorNumber}
                  onChange={(e) => handleSingleFloorChange('rooftop', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </label>
        </div>
      </div>
    </div>
  );

  const renderComplexFloorInputs = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Building Floor Structure</h4>
      <p className="text-xs text-gray-500">Configure the complete floor structure for villas or standalone buildings</p>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Basements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Basements
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={complexData.basements}
            onChange={(e) => handleComplexFloorChange('basements', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Floors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regular Floors
          </label>
          <input
            type="number"
            min="0"
            max="200"
            value={complexData.floors}
            onChange={(e) => handleComplexFloorChange('floors', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Mezzanines */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mezzanines
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={complexData.mezzanines}
            onChange={(e) => handleComplexFloorChange('mezzanines', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Ground Floor (always checked, disabled) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ground Floor
          </label>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              checked={complexData.hasGroundFloor}
              disabled
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded opacity-50"
            />
            <span className="text-sm text-gray-500">Always included</span>
          </div>
        </div>

        {/* Rooftop */}
        <div className="col-span-2">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="complex-rooftop"
              checked={complexData.hasRooftop}
              onChange={(e) => handleComplexFloorChange('hasRooftop', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <label htmlFor="complex-rooftop" className="text-sm font-medium text-gray-700">
              Has Rooftop Access
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Floor Level Configuration
        </label>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <input
              type="radio"
              id="mode-single"
              name="floorMode"
              checked={mode === 'single'}
              onChange={() => handleModeChange('single')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="mode-single" className="ml-2 text-sm font-medium text-gray-700">
              Single Floor
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="mode-complex"
              name="floorMode"
              checked={mode === 'complex'}
              onChange={() => handleModeChange('complex')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="mode-complex" className="ml-2 text-sm font-medium text-gray-700">
              Building Structure
            </label>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {mode === 'single' 
            ? 'Select a single floor level for apartments and individual units'
            : 'Configure the complete floor structure for villas or standalone buildings'
          }
        </p>
      </div>

      {/* Floor Inputs */}
      <div className="border border-gray-200 rounded-lg p-4">
        {mode === 'single' ? renderSingleFloorInputs() : renderComplexFloorInputs()}
      </div>

      {/* Error Display */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FloorLevelSelector;