import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TagIcon } from './Icons';

interface TagManagerProps {
    tags: string[];
    allTags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
}

export const TagManager: React.FC<TagManagerProps> = ({ tags, allTags, onTagsChange, placeholder = "Ajouter un tag..." }) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestions = allTags.filter(tag => 
        !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
    );

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onTagsChange([...tags, trimmedTag]);
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            addTag(inputValue);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light rounded-full text-sm font-medium"
                    >
                        <TagIcon className="w-3 h-3" />
                        {tag}
                        <button
                            onClick={() => removeTag(tag)}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-gray-800"
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {suggestions.map(tag => (
                            <button
                                key={tag}
                                onClick={() => addTag(tag)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <TagIcon className="w-4 h-4 text-gray-400" />
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
