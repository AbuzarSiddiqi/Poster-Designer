import React, { useState } from 'react';
import { AspectRatio, ImageFile } from '../types';
import { ASPECT_RATIOS } from '../constants';
import { Button } from './common/Button';
import { Icon } from './common/Icon';

interface ControlPanelProps {
  onGenerate: () => void;
  onEdit: () => void;
  onSuggestConcept: () => Promise<string>;
  onStartOver: () => void;
  onUploadPosterForEditing: (file: File) => void;
  isLoading: boolean;
  isPosterGenerated: boolean;

  // Lifted state and setters
  productImages: ImageFile[];
  setProductImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  referenceImage: ImageFile | null;
  setReferenceImage: React.Dispatch<React.SetStateAction<ImageFile | null>>;
  logoImage: ImageFile | null;
  setLogoImage: React.Dispatch<React.SetStateAction<ImageFile | null>>;
  selectedRatio: AspectRatio;
  setSelectedRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
  concept: string;
  setConcept: React.Dispatch<React.SetStateAction<string>>;
  posterHint: string;
  setPosterHint: React.Dispatch<React.SetStateAction<string>>;
  editPrompt: string;
  setEditPrompt: React.Dispatch<React.SetStateAction<string>>;
  editMode: 'create' | 'direct-edit';
  setEditMode: (mode: 'create' | 'direct-edit') => void;
}

const Section: React.FC<{ title: string; step: number; children: React.ReactNode, titleAction?: React.ReactNode }> = ({ title, step, children, titleAction }) => (
  <div className="border-b border-cyan-500/20 pb-6 mb-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-cyan-400 flex items-center">
        <span className="bg-cyan-500 text-gray-900 rounded-full h-6 w-6 flex items-center justify-center mr-3 text-sm font-black">{step}</span>
        {title}
      </h3>
      {titleAction}
    </div>
    {children}
  </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    onGenerate, 
    onEdit, 
    onSuggestConcept, 
    isLoading, 
    isPosterGenerated,
    productImages,
    setProductImages,
    referenceImage,
    setReferenceImage,
    logoImage,
    setLogoImage,
    selectedRatio,
    setSelectedRatio,
    concept,
    setConcept,
    posterHint,
    setPosterHint,
    editPrompt,
    setEditPrompt,
    editMode,
    setEditMode,
    onStartOver,
    onUploadPosterForEditing
}) => {
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImageFiles: ImageFile[] = files.map(file => ({
        id: crypto.randomUUID(),
        file: file,
        preview: URL.createObjectURL(file)
      }));
      setProductImages(prev => [...prev, ...newImageFiles]);
      e.target.value = ''; // Reset file input
    }
  };

  const handleProductPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                files.push(file);
            }
        }
    }

    if (files.length > 0) {
        e.preventDefault();
        const newImageFiles: ImageFile[] = files.map(file => ({
            id: crypto.randomUUID(),
            file: file,
            preview: URL.createObjectURL(file)
        }));
        setProductImages(prev => [...prev, ...newImageFiles]);
    }
  };

  const removeProductImage = (id: string) => {
    setProductImages(prev => prev.filter(img => img.id !== id));
  };
  
  const handleSingleFileSelect = (file: File, setFile: React.Dispatch<React.SetStateAction<ImageFile | null>>) => {
    setFile({
        id: crypto.randomUUID(),
        file: file,
        preview: URL.createObjectURL(file)
    });
  };

  const handleGenerateClick = () => {
    onGenerate();
  };
  
  const handleEditClick = () => {
    if(editPrompt){
        onEdit();
    }
  };

  const handleSuggestClick = async () => {
    if (productImages.length === 0) return;
    setIsSuggesting(true);
    try {
        const suggestion = await onSuggestConcept();
        setConcept(suggestion);
    } catch (error) {
        alert(error instanceof Error ? error.message : "Suggestion failed");
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleDirectEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onUploadPosterForEditing(e.target.files[0]);
        e.target.value = '';
    }
  };

  const handleDirectEditPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                  e.preventDefault();
                  onUploadPosterForEditing(file);
                  break; 
              }
          }
      }
  };

  const ImageInput: React.FC<{ id: string; label: string; image: ImageFile | null; onFileSelect: (file: File) => void, onRemove: () => void }> = ({ id, label, image, onFileSelect, onRemove }) => {
    
    const handlePaste = (e: React.ClipboardEvent<HTMLLabelElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    onFileSelect(file);
                    break; 
                }
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
            e.target.value = ''; // Reset
        }
    };

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            {image ? (
                <div className="group relative">
                    <img src={image.preview} alt="preview" className="w-full h-32 object-cover rounded-lg border-2 border-gray-600"/>
                    <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100">
                        <Icon icon="trash" className="h-5 w-5" />
                    </button>
                </div>
            ) : (
                <label 
                  htmlFor={id} 
                  onPaste={handlePaste}
                  tabIndex={0}
                  className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg bg-white/5 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                >
                    <Icon icon="upload" className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">Click or paste to upload</p>
                </label>
            )}
            <input id={id} type="file" className="hidden" accept="image/*" onChange={handleChange} />
        </div>
    );
  };

  return (
    <div className="w-full h-full bg-gray-800/50 backdrop-blur-md p-6 rounded-lg border border-cyan-500/20 overflow-y-auto">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-2 pb-4 border-b border-cyan-500/20">Poster Architect</h2>
      
      {!isPosterGenerated && (
          <div className="flex mb-4 -mt-2">
              <button 
                  onClick={() => setEditMode('create')}
                  className={`flex-1 py-2 text-center font-semibold transition-colors text-sm rounded-t-md ${editMode === 'create' ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
              >
                  Create New Poster
              </button>
              <button 
                  onClick={() => setEditMode('direct-edit')}
                  className={`flex-1 py-2 text-center font-semibold transition-colors text-sm rounded-t-md ${editMode === 'direct-edit' ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
              >
                  Edit Existing Image
              </button>
          </div>
      )}

      {isPosterGenerated ? (
        <>
            <Section title="Refine Your Poster" step={5} titleAction={
                 <button onClick={onStartOver} className="text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">
                    Start Over
                </button>
            }>
                <p className="text-gray-400 text-sm mb-4">Give the AI instructions to change the poster. Try things like "change the background to a beach" or "add a lens flare effect".</p>
                <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Your instructions..."
                    className="w-full h-28 p-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
            </Section>
            <Button onClick={handleEditClick} isLoading={isLoading} disabled={!editPrompt} className="w-full">
                <Icon icon="edit" className="h-5 w-5" />
                Apply Edit
            </Button>
        </>
      ) : editMode === 'create' ? (
        <>
          <Section title="Upload Product Image(s)" step={1}>
            <div onPaste={handleProductPaste} tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-lg p-1 -m-1">
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {productImages.map(image => (
                        <div key={image.id} className="group relative aspect-square">
                            <img src={image.preview} alt="product preview" className="w-full h-full object-cover rounded-lg border-2 border-gray-600"/>
                            <button onClick={() => removeProductImage(image.id)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100">
                                <Icon icon="trash" className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <label htmlFor="product-upload" className="cursor-pointer mt-2 flex items-center justify-center w-full py-2 border-2 border-gray-600 border-dashed rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm text-gray-400">
                    <Icon icon="upload" className="h-5 w-5 mr-2" />
                    Add Image(s)
                </label>
                <input id="product-upload" type="file" multiple className="hidden" accept="image/*" onChange={handleProductFileChange} />
                <p className="text-xs text-center text-gray-500 mt-2">You can also paste images from your clipboard.</p>
             </div>
          </Section>

          <Section title="Select Aspect Ratio" step={2}>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map(ratio => (
                <button 
                  key={ratio} 
                  onClick={() => setSelectedRatio(ratio)}
                  className={`py-2 px-3 text-sm rounded-md transition-all border-2 ${selectedRatio === ratio ? 'bg-cyan-500 border-cyan-500 text-white font-bold' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-cyan-600'}`}>
                  {ratio}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Describe Your Vision" step={3} titleAction={
             <Button onClick={handleSuggestClick} isLoading={isSuggesting} disabled={productImages.length === 0 || isSuggesting} variant="secondary" className="py-1 px-3 text-xs">
                <Icon icon="sparkles" className="h-4 w-4" />
                Suggest
            </Button>
          }>
            <label htmlFor="poster-hint" className="block text-sm font-medium text-gray-300 mb-1">Your Quick Idea (Optional)</label>
            <textarea
                id="poster-hint"
                value={posterHint}
                onChange={(e) => setPosterHint(e.target.value)}
                placeholder="e.g., modern, retro, summer vibe..."
                className="w-full h-16 p-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all mb-4"
            />
            <div className="flex items-center text-gray-500 text-xs mb-2">
                <span className="flex-grow border-t border-gray-600"></span>
                <span className="px-2 whitespace-nowrap">AI-Generated Concept</span>
                <span className="flex-grow border-t border-gray-600"></span>
            </div>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="A detailed concept will appear here..."
              className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
            <div className="mt-4">
              <ImageInput id="reference-upload" label="Reference Image (Optional)" image={referenceImage} onFileSelect={(file) => handleSingleFileSelect(file, setReferenceImage)} onRemove={() => setReferenceImage(null)} />
            </div>
          </Section>

          <Section title="Add Brand Logo" step={4}>
             <ImageInput id="logo-upload" label="Logo Image (Optional)" image={logoImage} onFileSelect={(file) => handleSingleFileSelect(file, setLogoImage)} onRemove={() => setLogoImage(null)} />
          </Section>

          <Button onClick={handleGenerateClick} isLoading={isLoading} disabled={productImages.length === 0 || !concept} className="w-full mt-4">
            <Icon icon="sparkles" className="h-5 w-5" />
            Generate Poster
          </Button>
        </>
      ) : (
        <Section title="Upload Image to Edit" step={1}>
            <div onPaste={handleDirectEditPaste} className="focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-lg p-1 -m-1">
                <label 
                  htmlFor="direct-edit-upload"
                  tabIndex={0}
                  className="cursor-pointer flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg bg-white/5 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                >
                    <Icon icon="gallery" className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-lg font-semibold text-gray-300">Upload Your Image</p>
                    <p className="text-sm text-gray-400">Click or paste an image to start editing</p>
                </label>
                <input id="direct-edit-upload" type="file" className="hidden" accept="image/*" onChange={handleDirectEditChange} />
            </div>
            <p className="text-sm text-center text-gray-500 mt-4">Upload any image or poster you want to modify using AI.</p>
        </Section>
      )}
    </div>
  );
};

export default ControlPanel;
