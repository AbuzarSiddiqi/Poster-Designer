import React from 'react';
import { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import GalleryPanel from './components/GalleryPanel';
import Workspace from './components/Workspace';
import MobileNav from './components/MobileNav';
import { removeBackground, generatePoster, editPoster, suggestConcept } from './services/geminiService';
import { AspectRatio, ImageFile } from './types';
import { fileToBase64, getMimeType } from './utils/fileUtils';

const App: React.FC = () => {
    const [productImagesNoBg, setProductImagesNoBg] = useState<{data: string, mimeType: string}[]>([]);
    
    // History state management
    const [posterHistory, setPosterHistory] = useState<{data: string, mimeType: string}[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    
    const [savedPosters, setSavedPosters] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [activeView, setActiveView] = useState<'controls' | 'workspace' | 'gallery'>('workspace');

    const currentPoster = historyIndex >= 0 ? posterHistory[historyIndex] : null;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < posterHistory.length - 1;

    const handleSuggestConcept = async (productImages: ImageFile[], hint: string): Promise<string> => {
        try {
            const imagePayload = await Promise.all(
                productImages.map(async (imgFile) => ({
                    base64: await fileToBase64(imgFile.file),
                    mimeType: getMimeType(imgFile.file),
                }))
            );
            const suggestion = await suggestConcept(imagePayload, hint);
            return suggestion;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get suggestion.';
            alert(message);
            throw new Error(message);
        }
    };

    const handleGenerate = async (productImageFiles: ImageFile[], concept: string, ratio: AspectRatio, referenceImageFile?: File, logoImageFile?: File) => {
        setIsLoading(true);
        setActiveView('workspace');
        try {
            setLoadingMessage(`Analyzing ${productImageFiles.length} product image(s)...`);
            const processedImages = await Promise.all(
                productImageFiles.map(async (imgFile) => {
                    const base64 = await fileToBase64(imgFile.file);
                    const mime = getMimeType(imgFile.file);
                    const noBgData = await removeBackground(base64, mime);
                    return { data: noBgData, mimeType: 'image/png' };
                })
            );
            setProductImagesNoBg(processedImages);
            
            setLoadingMessage('Crafting your poster vision...');
            let base64Ref: string | undefined, refMime: string | undefined;
            if (referenceImageFile) {
                base64Ref = await fileToBase64(referenceImageFile);
                refMime = getMimeType(referenceImageFile);
            }

            let base64Logo: string | undefined, logoMime: string | undefined;
            if (logoImageFile) {
                base64Logo = await fileToBase64(logoImageFile);
                logoMime = getMimeType(logoImageFile);
            }
            
            const posterData = await generatePoster(processedImages, concept, ratio, base64Ref, refMime, base64Logo, logoMime);
            const newPoster = {data: posterData, mimeType: 'image/png'};
            
            // Reset history with the new poster
            setPosterHistory([newPoster]);
            setHistoryIndex(0);

        } catch (error) {
            alert(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleEdit = async (prompt: string) => {
        if (!currentPoster) return;
        setIsLoading(true);
        setActiveView('workspace');
        setLoadingMessage('Applying your creative edits...');
        try {
            const editedPosterData = await editPoster(currentPoster.data, currentPoster.mimeType, prompt);
            const newPoster = {data: editedPosterData, mimeType: 'image/png'};

            // Truncate future history if we've undone, then create a new edit branch
            const newHistory = posterHistory.slice(0, historyIndex + 1);
            
            setPosterHistory([...newHistory, newPoster]);
            setHistoryIndex(newHistory.length);

        } catch (error) {
            alert(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleUndo = () => {
        if (canUndo) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (canRedo) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    const handleDownload = () => {
        if (!currentPoster) return;
        const link = document.createElement('a');
        link.href = `data:${currentPoster.mimeType};base64,${currentPoster.data}`;
        link.download = 'ai-poster.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
        if (currentPoster) {
            e.dataTransfer.setData('text/plain', `data:${currentPoster.mimeType};base64,${currentPoster.data}`);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const posterUrl = e.dataTransfer.getData('text/plain');
        if (posterUrl && !savedPosters.includes(posterUrl)) {
            setSavedPosters(prev => [...prev, posterUrl]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const controlPanel = <ControlPanel 
        onGenerate={handleGenerate}
        onEdit={handleEdit}
        onSuggestConcept={handleSuggestConcept}
        isLoading={isLoading}
        isPosterGenerated={!!currentPoster}
    />;

    const workspace = <Workspace 
        poster={currentPoster ? `data:${currentPoster.mimeType};base64,${currentPoster.data}` : null}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        onDragStart={handleDragStart}
        onDownload={handleDownload}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
    />;

    const galleryPanel = <GalleryPanel posters={savedPosters} onDrop={handleDrop} onDragOver={handleDragOver}/>;

    return (
        <div className="h-screen w-screen bg-gray-900 text-white font-sans">
            {/* Desktop Layout: 3-column */}
            <div className="hidden md:flex h-full w-full p-4 gap-4">
                <div className="w-1/4 h-full">{controlPanel}</div>
                <div className="w-1/2 h-full">{workspace}</div>
                <div className="w-1/4 h-full">{galleryPanel}</div>
            </div>

            {/* Mobile Layout: Tabbed */}
            <div className="md:hidden h-full w-full flex flex-col">
                <main className="flex-grow p-2 pb-20 overflow-hidden">
                    {activeView === 'controls' && controlPanel}
                    {activeView === 'workspace' && workspace}
                    {activeView === 'gallery' && galleryPanel}
                </main>
                <MobileNav activeView={activeView} setActiveView={setActiveView} />
            </div>
        </div>
    );
};

export default App;