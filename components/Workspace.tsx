
import React from 'react';
import Spinner from './common/Spinner';
import { Icon } from './common/Icon';

interface WorkspaceProps {
  poster: string | null;
  isLoading: boolean;
  loadingMessage: string;
  onDragStart: (e: React.DragEvent<HTMLImageElement>) => void;
  onDownload: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ poster, isLoading, loadingMessage, onDragStart, onDownload }) => {
  return (
    <div className="relative w-full h-full bg-gray-900/50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-700 overflow-hidden">
      {isLoading && <Spinner message={loadingMessage} />}
      
      {!isLoading && !poster && (
        <div className="text-center text-gray-500">
          <Icon icon="sparkles" className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Your AI Poster Will Appear Here</h3>
          <p className="mt-1">Fill out the details on the left to get started.</p>
        </div>
      )}

      {poster && (
        <>
          <img
            src={poster}
            alt="Generated poster"
            className="max-w-full max-h-full object-contain cursor-grab"
            draggable="true"
            onDragStart={onDragStart}
          />
          <button 
            onClick={onDownload}
            className="absolute bottom-4 right-4 bg-cyan-500 text-white p-3 rounded-full shadow-lg hover:bg-cyan-400 transition-all hover:scale-110"
            title="Download Poster"
            >
            <Icon icon="download" className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
};

export default Workspace;
