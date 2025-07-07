import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react'; // Optional icon

type Option = {
    name: string;
};

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
}

const SelectElement: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Choose..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
                <span>{value || placeholder}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {isOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map((option) => (
                        <li
                            key={option.name}
                            onClick={() => handleSelect(option.name.toLowerCase())}
                            className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${option.name === value ? 'bg-blue-50 font-semibold' : ''
                                }`}
                        >
                            {option.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SelectElement;
