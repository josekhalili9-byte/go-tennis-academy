import React, { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  isAdmin: boolean;
  multiline?: boolean;
  className?: string;
  as?: React.ElementType;
}

export function EditableText({ value, onChange, isAdmin, multiline = false, className = '', as: Component = 'span' }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const ref = useRef<any>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
  };

  if (isAdmin && isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={ref}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          className={`w-full bg-white/20 border-b-2 border-green-500 focus:outline-none p-1 rounded resize-none ${className}`}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={ref}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white/20 border-b-2 border-green-500 focus:outline-none p-1 rounded flex-1 ${className}`}
      />
    );
  }

  if (isAdmin) {
    return (
      <Component 
        className={`cursor-pointer hover:bg-green-500/20 hover:ring-2 ring-green-400 rounded transition-colors px-1 ${className}`} 
        onClick={() => setIsEditing(true)}
      >
        {value}
      </Component>
    );
  }

  return <Component className={className}>{value}</Component>;
}
