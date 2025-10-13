import React from 'react';
import { Trash2 } from 'lucide-react';

interface FileDeleterProps {
  files: File[];
  onDelete: (index: number) => void;
}

const FileDeleter: React.FC<FileDeleterProps> = ({ files, onDelete }) => {
  return (
    <ul>
      {files.map((file, index) => (
        <li key={index} className="flex items-center justify-between">
          <span>{file.name}</span>
          <button onClick={() => onDelete(index)} className="text-red-900 hover:text-black cursor-pointer">
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default FileDeleter;
