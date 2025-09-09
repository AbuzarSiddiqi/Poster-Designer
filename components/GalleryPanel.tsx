
import React from 'react';
import { Icon } from './common/Icon';

interface GalleryPanelProps {
  posters: string[];
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

const GalleryPanel: React.FC<GalleryPanelProps> = ({ posters, onDrop, onDragOver }) => {

  const downloadImage = (base64Image: string, index: number) => {
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = `poster-design-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  return (
    <div 
      className="w-full h-full bg-gray-800/50 backdrop-blur-md p-6 rounded-lg border border-cyan-500/20"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <h2 className="text-2xl font-bold text-white mb-6 pb-4 border-b border-cyan-500/20">My Posters</h2>
      <div className="h-[calc(100%-60px)] overflow-y-auto pr-2">
        {posters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg p-4">
            <p>Drag and drop your favorite posters here to save them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {posters.map((poster, index) => (
              <div key={index} className="group relative aspect-[9/16] rounded-md overflow-hidden border-2 border-gray-700">
                <img src={poster} alt={`Saved poster ${index + 1}`} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                        onClick={() => downloadImage(poster, index)}
                        className="p-3 bg-cyan-500/80 rounded-full text-white hover:bg-cyan-500/100"
                        title="Download"
                    >
                        <Icon icon="download" className="h-6 w-6"/>
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPanel;
