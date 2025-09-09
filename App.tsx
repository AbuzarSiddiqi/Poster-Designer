import React from 'react';
import { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import GalleryPanel from './components/GalleryPanel';
import Workspace from './components/Workspace';
import MobileNav from './components/MobileNav';
import { removeBackground, generatePoster, editPoster, suggestConcept } from './services/geminiService';
import { AspectRatio, ImageFile } from './types';
import { fileToBase64, getMimeType } from './utils/fileUtils';
import { useHistoryState } from './hooks/useHistoryState';

const App: React.FC = () => {
    // State lifted from ControlPanel to persist across mobile view changes
    const [productImages, setProductImages] = useState<ImageFile[]>([]);
    const [referenceImage, setReferenceImage] = useState<ImageFile | null>(null);
    const [logoImage, setLogoImage] = useState<ImageFile | null>(null);
    const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
    const [concept, setConcept] = useState('');
    const [posterHint, setPosterHint] = useState('');
    const [editPrompt, setEditPrompt] = useState('');

    // History state management using custom hook
    const {
        current: currentPoster,
        setState: setPosterState,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useHistoryState<{data: string, mimeType: string}>();
    
    const [savedPosters, setSavedPosters] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [activeView, setActiveView] = useState<'controls' | 'workspace' | 'gallery'>('workspace');

    const handleSuggestConcept = async (): Promise<string> => {
        try {
            const imagePayload = await Promise.all(
                productImages.map(async (imgFile) => ({
                    base64: await fileToBase64(imgFile.file),
                    mimeType: getMimeType(imgFile.file),
                }))
            );

            let referencePayload: { base64: string, mimeType: string } | undefined;
            if (referenceImage?.file) {
                referencePayload = {
                    base64: await fileToBase64(referenceImage.file),
                    mimeType: getMimeType(referenceImage.file)
                };
            }

            const suggestion = await suggestConcept(imagePayload, posterHint, referencePayload);
            return suggestion;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get suggestion.';
            alert(message);
            throw new Error(message);
        }
    };

    const handleGenerate = async () => {
        if (productImages.length === 0 || !concept) return;

        setIsLoading(true);
        setActiveView('workspace');
        try {
            setLoadingMessage(`Analyzing ${productImages.length} product image(s)...`);
            const processedImages = await Promise.all(
                productImages.map(async (imgFile) => {
                    const base64 = await fileToBase64(imgFile.file);
                    const mime = getMimeType(imgFile.file);
                    const noBgData = await removeBackground(base64, mime);
                    return { data: noBgData, mimeType: 'image/png' };
                })
            );
            
            setLoadingMessage('Crafting your poster vision...');
            let base64Ref: string | undefined, refMime: string | undefined;
            if (referenceImage?.file) {
                base64Ref = await fileToBase64(referenceImage.file);
                refMime = getMimeType(referenceImage.file);
            }

            let base64Logo: string | undefined, logoMime: string | undefined;
            if (logoImage?.file) {
                base64Logo = await fileToBase64(logoImage.file);
                logoMime = getMimeType(logoImage.file);
            }
            
            const posterData = await generatePoster(processedImages, concept, selectedRatio, base64Ref, refMime, base64Logo, logoMime);
            const newPoster = {data: posterData, mimeType: 'image/png'};
            
            setPosterState(newPoster, true);

        } catch (error) {
            alert(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleEdit = async () => {
        if (!currentPoster || !editPrompt) return;

        setIsLoading(true);
        setActiveView('workspace');
        setLoadingMessage('Applying your creative edits...');
        try {
            const editedPosterData = await editPoster(currentPoster.data, currentPoster.mimeType, editPrompt);
            const newPoster = {data: editedPosterData, mimeType: 'image/png'};
            
            setPosterState(newPoster);
            setEditPrompt(''); // Clear prompt after submission

        } catch (error) {
            alert(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
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
        isLoading={isLoading}
        isPosterGenerated={!!currentPoster}
        // State and setters
        productImages={productImages}
        setProductImages={setProductImages}
        referenceImage={referenceImage}
        setReferenceImage={setReferenceImage}
        logoImage={logoImage}
        setLogoImage={setLogoImage}
        selectedRatio={selectedRatio}
        setSelectedRatio={setSelectedRatio}
        concept={concept}
        setConcept={setConcept}
        posterHint={posterHint}
        setPosterHint={setPosterHint}
        editPrompt={editPrompt}
        setEditPrompt={setEditPrompt}
        // Handlers
        onGenerate={handleGenerate}
        onEdit={handleEdit}
        onSuggestConcept={handleSuggestConcept}
    />;

    const workspace = <Workspace 
        poster={currentPoster ? `data:${currentPoster.mimeType};base64,${currentPoster.data}` : null}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        onDragStart={handleDragStart}
        onDownload={handleDownload}
        onUndo={undo}
        onRedo={redo}
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
                <main className="flex-grow p-2 pb-20 overflow-y-auto">
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
