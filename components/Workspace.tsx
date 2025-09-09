import React from 'react';
import Spinner from './common/Spinner';
import { Icon } from './common/Icon';

interface WorkspaceProps {
  poster: string | null;
  isLoading: boolean;
  loadingMessage: string;
  onDragStart: (e: React.DragEvent<HTMLImageElement>) => void;
  onDownload: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({ poster, isLoading, loadingMessage, onDragStart, onDownload, onUndo, onRedo, canUndo, canRedo }) => {
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
          <div 
            className="absolute bottom-4 right-4 flex items-center gap-3"
            >
             <button
                onClick={onUndo}
                disabled={!canUndo}
                className="bg-gray-800/80 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                title="Undo"
            >
                <Icon icon="undo" className="h-6 w-6" />
            </button>
            <button
                onClick={onRedo}
                disabled={!canRedo}
                className="bg-gray-800/80 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                title="Redo"
            >
                <Icon icon="redo" className="h-6 w-6" />
            </button>
            <button 
              onClick={onDownload}
              className="bg-cyan-500 text-white p-3 rounded-full shadow-lg hover:bg-cyan-400 transition-all hover:scale-110"
              title="Download Poster"
              >
              <Icon icon="download" className="h-6 w-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Workspace;