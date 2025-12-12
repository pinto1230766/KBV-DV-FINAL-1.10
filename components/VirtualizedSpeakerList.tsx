import React, { memo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Speaker } from '../types';
import { UserCircleIcon, UserIcon, StarIcon } from './Icons';

interface SpeakerItemProps {
    speaker: Speaker;
    onEdit: (speaker: Speaker) => void;
    onSchedule: (speaker: Speaker) => void;
    onSendMessage: (speaker: Speaker) => void;
    style: React.CSSProperties;
}

const SpeakerItem = memo(({ speaker, onEdit, onSchedule, onSendMessage, style }: SpeakerItemProps) => {
    return (
        <div 
            style={style}
            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
            <div className="flex items-center p-3 bg-white dark:bg-card-dark rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {speaker.photoUrl ? (
                            <img 
                                src={speaker.photoUrl} 
                                alt={speaker.nom} 
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <UserIcon className="w-6 h-6" />
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {speaker.nom}
                        </h3>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <UserCircleIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <span className="truncate">{speaker.congregation}</span>
                    </div>
                    {speaker.telephone && (
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <span className="truncate">{speaker.telephone}</span>
                        </div>
                    )}
                    {speaker.tags && speaker.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                            {speaker.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    <StarIcon className="mr-1 h-3 w-3" />
                                    {tag}
                                </span>
                            ))}
                            {speaker.tags.length > 3 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">+{speaker.tags.length - 3} plus</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                        onClick={() => onEdit(speaker)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Modifier
                    </button>
                    <button
                        onClick={() => onSchedule(speaker)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Programmer
                    </button>
                </div>
            </div>
        </div>
    );
});

interface VirtualizedSpeakerListProps {
    speakers: Speaker[];
    onEdit: (speaker: Speaker) => void;
    onSchedule: (speaker: Speaker) => void;
    onSendMessage: (speaker: Speaker) => void;
    height?: number | string;
    itemSize?: number;
}

export const VirtualizedSpeakerList: React.FC<VirtualizedSpeakerListProps> = ({
    speakers,
    onEdit,
    onSchedule,
    onSendMessage,
    height = '100%',
    itemSize = 100,
}) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: speakers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => itemSize,
        overscan: 5,
    });

    return (
        <div 
            ref={parentRef}
            style={{
                height: typeof height === 'number' ? `${height}px` : height,
                overflow: 'auto',
            }}
            className="w-full"
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const speaker = speakers[virtualRow.index];
                    return (
                        <SpeakerItem
                            key={virtualRow.key}
                            speaker={speaker}
                            onEdit={onEdit}
                            onSchedule={onSchedule}
                            onSendMessage={onSendMessage}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
