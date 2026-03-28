
import React, { useState, useRef } from 'react';
import { UploadIcon, ArrowPathIcon, ExportIcon } from './icons';
import Header from './Header';
import { processRawFile, RAW_EXTENSIONS_STRING, type RawConvertOptions } from '../utils/rawProcessor';
import { useTranslation } from '../contexts/LanguageContext';

interface RAWConverterViewProps {
    title: string;
    onOpenApiKeyModal: () => void;
    onToggleSidebar: () => void;
    addNotification: (message: string, type?: 'info' | 'error') => void;
    onFilesConverted: (files: File[]) => Promise<void> | void;
}

interface ConvertedFile {
    originalName: string;
    convertedName: string;
    originalSize: number;
    blob: Blob;
    url: string;
    sizeLabel: string;
    width: number;
    height: number;
    savedToFolder: boolean;
}

const RESOLUTION_PRESETS = [
    { label: 'raw_res_original', value: 0 },
    { label: '6000px', value: 6000 },
    { label: '4000px', value: 4000 },
    { label: '2000px', value: 2000 },
    { label: '1200px', value: 1200 },
];

// @ts-ignore - File System Access API types
const hasDirectoryPicker = typeof window !== 'undefined' && !!window.showDirectoryPicker;

const RAWConverterView: React.FC<RAWConverterViewProps> = ({
    title,
    onOpenApiKeyModal,
    onToggleSidebar,
    addNotification,
    onFilesConverted
}) => {
    const { t } = useTranslation();
    const [rawFiles, setRawFiles] = useState<File[]>([]);
    const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [outputDirHandle, setOutputDirHandle] = useState<any>(null);
    const [outputDirName, setOutputDirName] = useState<string>('');
    const [errorCount, setErrorCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Conversion settings
    const [quality, setQuality] = useState(92);
    const [maxResolution, setMaxResolution] = useState(0);

    const handleFileSelect = (files: FileList | null) => {
        if (files) {
            const newFiles = Array.from(files);
            setRawFiles(newFiles);
            setConvertedFiles([]);
            setErrorCount(0);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handlePickOutputFolder = async () => {
        try {
            // @ts-ignore - File System Access API (Chrome/Edge)
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            setOutputDirHandle(dirHandle);
            setOutputDirName(dirHandle.name);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                addNotification(t.raw_save_folder_error, 'error');
            }
        }
    };

    const saveFileToDir = async (dirHandle: any, fileName: string, blob: Blob): Promise<boolean> => {
        try {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return true;
        } catch (e) {
            console.error(`Save failed: ${fileName}`, e);
            return false;
        }
    };

    const handleConvert = async () => {
        if (rawFiles.length === 0) {
            addNotification(t.raw_no_files, 'error');
            return;
        }

        setIsConverting(true);
        setProgress({ current: 0, total: rawFiles.length });
        setErrorCount(0);
        const newConvertedFiles: ConvertedFile[] = [];
        let errors = 0;

        const options: RawConvertOptions = { quality, maxResolution };

        for (const file of rawFiles) {
            try {
                const jpegFile = await processRawFile(file, options);
                const sizeInMB = (jpegFile.size / (1024 * 1024)).toFixed(2);

                const url = URL.createObjectURL(jpegFile);
                const dims = await new Promise<{w: number, h: number}>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ w: img.width, h: img.height });
                    img.onerror = () => resolve({ w: 0, h: 0 });
                    img.src = url;
                });

                // Save to folder if selected
                let savedToFolder = false;
                if (outputDirHandle) {
                    savedToFolder = await saveFileToDir(outputDirHandle, jpegFile.name, jpegFile);
                    if (!savedToFolder) {
                        addNotification(`${t.raw_save_file_error} ${jpegFile.name}`, 'error');
                    }
                }

                newConvertedFiles.push({
                    originalName: file.name,
                    convertedName: jpegFile.name,
                    originalSize: file.size,
                    blob: jpegFile,
                    url,
                    sizeLabel: `${sizeInMB} MB`,
                    width: dims.w,
                    height: dims.h,
                    savedToFolder,
                });

            } catch (error: any) {
                errors++;
                console.error(`RAW conversion failed for ${file.name}:`, error);
                addNotification(`${file.name}: ${error.message || 'Konverze selhala'}`, 'error');
            } finally {
                setProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }
        }

        setConvertedFiles(newConvertedFiles);
        setErrorCount(errors);
        setIsConverting(false);

        if (newConvertedFiles.length > 0) {
            const savedCount = newConvertedFiles.filter(f => f.savedToFolder).length;
            if (savedCount > 0) {
                addNotification(`${savedCount} ${t.raw_save_folder_success}`, 'info');
            }
        }
    };

    const handleAddToProject = () => {
        const files = convertedFiles.map(cf => new File([cf.blob], cf.convertedName, { type: 'image/jpeg' }));
        onFilesConverted(files);
    };

    const handleSaveToFolder = async () => {
        if (convertedFiles.length === 0) return;
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            let saved = 0;
            for (const file of convertedFiles) {
                const ok = await saveFileToDir(dirHandle, file.convertedName, file.blob);
                if (ok) {
                    saved++;
                } else {
                    addNotification(`${t.raw_save_file_error} ${file.convertedName}`, 'error');
                }
            }
            if (saved > 0) {
                addNotification(`${saved} ${t.raw_save_folder_success}`, 'info');
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                addNotification(t.raw_save_folder_error, 'error');
            }
        }
    };

    const downloadFile = (url: string, name: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatSize = (bytes: number) => {
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    return (
        <div className="h-full w-full flex flex-col">
             <Header
                title={title}
                onOpenApiKeyModal={onOpenApiKeyModal}
                onToggleSidebar={onToggleSidebar}
            />

            <div className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-y-auto">
                <div className="w-full max-w-6xl">
                     <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">{t.raw_title}</h1>
                        <p className="mt-3 text-xl text-text-secondary max-w-3xl mx-auto">
                            {t.raw_subtitle}
                        </p>
                    </div>

                    <div className="bg-surface p-8 border border-border-subtle">
                    {convertedFiles.length === 0 ? (
                        <>
                        {/* Drop zone */}
                        <div
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                            onDrop={handleDrop}
                            className={`p-10 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-accent bg-accent/10' : 'border-border-subtle'}`}
                        >
                            <div className="text-center">
                                <UploadIcon className="mx-auto h-12 w-12 text-text-secondary" />
                                <p className="mt-4 font-semibold text-text-primary">
                                    {rawFiles.length > 0 ? `${rawFiles.length} ${t.raw_files_selected || 'souborů vybráno'}` : t.raw_drag}
                                </p>
                                <p className="text-sm text-text-secondary">{t.raw_or_click}</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="*/*"
                                    onChange={(e) => handleFileSelect(e.target.files)}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-4 px-4 py-2 text-sm font-semibold text-accent rounded-md hover:bg-accent/10 transition-colors"
                                >
                                    {rawFiles.length > 0 ? t.raw_select_other : t.upload_btn}
                                </button>
                            </div>
                        </div>

                        {/* Settings panel - visible when files are selected */}
                        {rawFiles.length > 0 && (
                            <div className="mt-6 p-5 bg-elevated border border-border-subtle rounded-lg">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
                                    {t.raw_settings || 'Nastavení konverze'}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {/* Quality slider */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            {t.raw_quality || 'Kvalita JPEG'}: <span className="text-accent font-bold">{quality}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min={10}
                                            max={100}
                                            step={1}
                                            value={quality}
                                            onChange={(e) => setQuality(Number(e.target.value))}
                                            className="w-full h-2 bg-void rounded-lg appearance-none cursor-pointer accent-accent"
                                        />
                                        <div className="flex justify-between text-xs text-text-secondary mt-1">
                                            <span>{t.raw_quality_small || 'Menší soubor'}</span>
                                            <span>{t.raw_quality_best || 'Nejlepší kvalita'}</span>
                                        </div>
                                    </div>

                                    {/* Resolution select */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            {t.raw_resolution || 'Rozlišení'}
                                        </label>
                                        <select
                                            value={maxResolution}
                                            onChange={(e) => setMaxResolution(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-void border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:border-accent"
                                        >
                                            {RESOLUTION_PRESETS.map(p => (
                                                <option key={p.value} value={p.value}>
                                                    {p.value === 0 ? (t.raw_res_original || 'Originál') : p.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Output folder picker */}
                                    {hasDirectoryPicker && (
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                                {t.raw_output_folder || 'Výstupní složka'}
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handlePickOutputFolder}
                                                className="w-full px-3 py-2 bg-void border border-border-subtle rounded-md text-sm text-left focus:outline-none focus:border-accent hover:bg-accent/5 transition-colors"
                                            >
                                                {outputDirName ? (
                                                    <span className="text-accent font-medium">{outputDirName}</span>
                                                ) : (
                                                    <span className="text-text-secondary">{t.raw_pick_folder || 'Vybrat složku...'}</span>
                                                )}
                                            </button>
                                            {!outputDirName && (
                                                <p className="text-xs text-text-secondary mt-1 opacity-70">
                                                    {t.raw_pick_folder_hint || 'Volitelné - jinak uložíte ručně po konverzi'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        </>
                    ) : (
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold">{t.raw_done}</h3>
                                {errorCount > 0 && (
                                    <span className="text-sm text-red-400">{errorCount} {t.raw_errors || 'chyb'}</span>
                                )}
                            </div>
                            <p className="text-sm text-text-secondary mb-1">
                                {t.raw_quality || 'Kvalita'}: {quality}% | {t.raw_resolution || 'Rozlišení'}: {maxResolution === 0 ? (t.raw_res_original || 'Originál') : `${maxResolution}px`}
                            </p>
                            {outputDirName && (
                                <p className="text-sm text-accent mb-4">
                                    {t.raw_saved_to || 'Uloženo do'}: {outputDirName}/
                                </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {convertedFiles.map((file) => (
                                    <div key={file.convertedName} className="group relative aspect-square bg-elevated rounded-lg overflow-hidden shadow-md border border-border-subtle/50">
                                        <img src={file.url} alt={file.convertedName} className="w-full h-full object-contain" />
                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                                <div className="px-2 py-1 bg-void border border-border-subtle text-text-secondary text-xs flex flex-col items-end">
                                                    <span className="font-medium text-text-primary">{file.width}x{file.height}</span>
                                                    <span className="opacity-70 text-[10px]">{formatSize(file.originalSize)} → {file.sizeLabel}</span>
                                                </div>
                                                {file.savedToFolder && (
                                                    <div className="px-2 py-0.5 bg-green-900/60 border border-green-700/50 text-green-300 text-[10px] rounded">
                                                        ✓ {t.raw_saved || 'Uloženo'}
                                                    </div>
                                                )}
                                        </div>

                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => downloadFile(file.url, file.convertedName)} className="p-3 bg-elevated border border-border-subtle text-text-primary transition-none" title="Download">
                                                <ExportIcon className="w-8 h-8" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-center text-text-primary truncate">
                                            {file.originalName} → {file.convertedName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        {convertedFiles.length === 0 ? (
                            <button
                                onClick={handleConvert}
                                disabled={isConverting || rawFiles.length === 0}
                                className="w-full inline-flex items-center justify-center px-6 py-4 border border-accent text-lg font-semibold text-void bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-none"
                            >
                                <ArrowPathIcon className="mr-3 h-6 w-6" />
                                {isConverting
                                    ? `${t.raw_converting} (${progress.current}/${progress.total})...`
                                    : `${t.raw_convert} ${rawFiles.length === 0 ? '' : rawFiles.length} ${outputDirName ? `→ ${outputDirName}/` : ''}`
                                }
                            </button>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleAddToProject}
                                    className="w-full inline-flex items-center justify-center px-6 py-4 border border-accent text-lg font-semibold text-void bg-accent transition-none"
                                >
                                    {t.raw_open_editor}
                                </button>
                                {!convertedFiles.every(f => f.savedToFolder) && hasDirectoryPicker && (
                                    <button
                                        onClick={handleSaveToFolder}
                                        className="w-full inline-flex items-center justify-center px-6 py-4 border border-border-subtle text-lg font-semibold text-text-primary bg-elevated hover:bg-accent/10 transition-colors"
                                    >
                                        <ExportIcon className="mr-3 h-6 w-6" />
                                        {t.raw_save_folder}
                                    </button>
                                )}
                                <button
                                    onClick={() => { setRawFiles([]); setConvertedFiles([]); setOutputDirHandle(null); setOutputDirName(''); setErrorCount(0); }}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-border-subtle text-sm font-medium text-text-primary bg-elevated hover:bg-elevated transition-colors"
                                >
                                    {t.raw_convert_more}
                                </button>
                            </div>
                        )}
                        {isConverting && (
                            <div className="w-full bg-elevated rounded-full h-2.5 mt-4">
                                <div className="bg-accent h-2.5 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default RAWConverterView;
