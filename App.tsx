import React from 'react';
import { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import GalleryPanel from './components/GalleryPanel';
import Workspace from './components/Workspace';
import { removeBackground, generatePoster, editPoster, suggestConcept } from './services/geminiService';
import { AspectRatio, ImageFile } from './types';
import { fileToBase64, getMimeType } from './utils/fileUtils';

const App: React.FC = () => {
    // FIX: Changed state property from `mime` to `mimeType` for consistency.
    const [productImagesNoBg, setProductImagesNoBg] = useState<{data: string, mimeType: string}[]>([]);
    // FIX: Changed state property from `mime` to `mimeType` for consistency.
    const [currentPoster, setCurrentPoster] = useState<{data: string, mimeType: string} | null>(null);
    const [savedPosters, setSavedPosters] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

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
        try {
            // Step 1: Remove background from all product images
            setLoadingMessage(`Analyzing ${productImageFiles.length} product image(s)...`);
            const processedImages = await Promise.all(
                productImageFiles.map(async (imgFile) => {
                    const base64 = await fileToBase64(imgFile.file);
                    const mime = getMimeType(imgFile.file);
                    const noBgData = await removeBackground(base64, mime);
                    // FIX: Changed property from `mime` to `mimeType` to match the `generatePoster` function signature.
                    return { data: noBgData, mimeType: 'image/png' };
                })
            );
            setProductImagesNoBg(processedImages);
            
            // Step 2: Generate Poster
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
            // FIX: Changed property from `mime` to `mimeType` for consistency.
            setCurrentPoster({data: posterData, mimeType: 'image/png'});

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
        setLoadingMessage('Applying your creative edits...');
        try {
            // FIX: Passed `currentPoster.mimeType` instead of `currentPoster.mime` to match `editPoster` function signature.
            const editedPosterData = await editPoster(currentPoster.data, currentPoster.mimeType, prompt);
            // FIX: Changed property from `mime` to `mimeType` for consistency.
            setCurrentPoster({data: editedPosterData, mimeType: 'image/png'});
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
        // FIX: Used `currentPoster.mimeType` instead of `currentPoster.mime`.
        link.href = `data:${currentPoster.mimeType};base64,${currentPoster.data}`;
        link.download = 'ai-poster.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
        if (currentPoster) {
            // FIX: Used `currentPoster.mimeType` instead of `currentPoster.mime`.
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

    return (
        <div className="h-screen w-screen bg-gray-900 text-white p-4 flex gap-4 font-sans">
            <div className="w-1/4 h-full">
                <ControlPanel 
                    onGenerate={handleGenerate}
                    onEdit={handleEdit}
                    onSuggestConcept={handleSuggestConcept}
                    isLoading={isLoading}
                    isPosterGenerated={!!currentPoster}
                />
            </div>
            <div className="w-1/2 h-full">
                <Workspace 
                    // FIX: Used `currentPoster.mimeType` instead of `currentPoster.mime`.
                    poster={currentPoster ? `data:${currentPoster.mimeType};base64,${currentPoster.data}` : null}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    onDragStart={handleDragStart}
                    onDownload={handleDownload}
                />
            </div>
            <div className="w-1/4 h-full">
                <GalleryPanel posters={savedPosters} onDrop={handleDrop} onDragOver={handleDragOver}/>
            </div>
        </div>
    );
};

export default App;