import React from 'react';
import { FolderIcon, TrashIcon } from '@heroicons/react/24/solid';

interface FolderItemProps {
  name: string;
  isAdmin: boolean;
  onDelete?: () => void;
  onClick: () => void;
}

export const FolderItem = ({ name, isAdmin, onDelete, onClick }: FolderItemProps) => {
  return (
    <div
      className="folder-item group"
      onClick={onClick}
    >
      <FolderIcon className="folder-icon" />
      <span className="flex-1">{name}</span>
      {isAdmin && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="delete-button"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}; 