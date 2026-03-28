
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
}

const RESOLUTION_PRESETS = [
    { label: 'raw_res_original', value: 0 },
    { label: '6000px', value: 6000 },
    { label: '4000px', value: 4000 },
    { label: '2000px', value: 2000 },
    { label: '1200px', value: 1200 },
];

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
    const [conversionError, setConversionError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [quality, setQuality] = useState(92);
    const [maxResolution, setMaxResolution] = useState(0);

    const handleFileSelect = (files: FileList | null) => {
        if (files) {
            setRawFiles(Array.from(files));
            setConvertedFiles([]);
            setConversionError('');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    const handleConvert = async () => {
        if (rawFiles.length === 0) {
            addNotification(t.raw_no_files, 'error');
            return;
        }

        // 1) Zeptat se kam uložit
        let dirHandle: any = null;
        try {
            // @ts-ignore - File System Access API
            dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        } catch (e: any) {
            if (e.name === 'AbortError') return; // uživatel zrušil
            // Fallback - showDirectoryPicker není k dispozici, použijeme download
            dirHandle = null;
        }

        // 2) Konvertovat
        setIsConverting(true);
        setProgress({ current: 0, total: rawFiles.length });
        setConversionError('');
        const results: ConvertedFile[] = [];
        const errors: string[] = [];

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

                // 3) Uložit do vybrané složky nebo stáhnout
                if (dirHandle) {
                    try {
                        const fh = await dirHandle.getFileHandle(jpegFile.name, { create: true });
                        const writable = await fh.createWritable();
                        await writable.write(jpegFile);
                        await writable.close();
                    } catch (saveErr) {
                        downloadBlob(jpegFile, jpegFile.name);
                    }
                } else {
                    downloadBlob(jpegFile, jpegFile.name);
                }

                results.push({
                    originalName: file.name,
                    convertedName: jpegFile.name,
                    originalSize: file.size,
                    blob: jpegFile,
                    url,
                    sizeLabel: `${sizeInMB} MB`,
                    width: dims.w,
                    height: dims.h,
                });

            } catch (error: any) {
                const msg = `${file.name}: ${error.message || 'Konverze selhala'}`;
                errors.push(msg);
            } finally {
                setProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }
        }

        setConvertedFiles(results);
        setIsConverting(false);

        if (errors.length > 0) {
            setConversionError(errors.join('\n'));
        }

        if (results.length > 0) {
            addNotification(`${results.length} ${t.notify_raw_success}`, 'info');
        }
    };

    const handleAddToProject = () => {
        const files = convertedFiles.map(cf => new File([cf.blob], cf.convertedName, { type: 'image/jpeg' }));
        onFilesConverted(files);
    };

    const handleDownloadAll = () => {
        for (const file of convertedFiles) {
            downloadBlob(file.blob, file.convertedName);
        }
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
                        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">{t.raw_title} <span className="text-sm text-text-secondary font-normal">v2</span></h1>
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

                        {/* Settings */}
                        {rawFiles.length > 0 && (
                            <div className="mt-6 p-5 bg-elevated border border-border-subtle rounded-lg">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
                                    {t.raw_settings || 'Nastavení konverze'}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            {t.raw_quality || 'Kvalita JPEG'}: <span className="text-accent font-bold">{quality}%</span>
                                        </label>
                                        <input
                                            type="range" min={10} max={100} step={1}
                                            value={quality}
                                            onChange={(e) => setQuality(Number(e.target.value))}
                                            className="w-full h-2 bg-void rounded-lg appearance-none cursor-pointer accent-accent"
                                        />
                                        <div className="flex justify-between text-xs text-text-secondary mt-1">
                                            <span>{t.raw_quality_small || 'Menší soubor'}</span>
                                            <span>{t.raw_quality_best || 'Nejlepší kvalita'}</span>
                                        </div>
                                    </div>
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
                                </div>
                            </div>
                        )}

                        {/* Error display */}
                        {conversionError && (
                            <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                                <h4 className="text-sm font-bold text-red-300 mb-2">Chyby konverze:</h4>
                                <pre className="text-xs text-red-200 whitespace-pre-wrap">{conversionError}</pre>
                            </div>
                        )}
                        </>
                    ) : (
                        <div>
                            <h3 className="text-xl font-bold mb-2">{t.raw_done} - {convertedFiles.length} JPEG</h3>
                            <p className="text-sm text-text-secondary mb-4">
                                {t.raw_quality || 'Kvalita'}: {quality}% | {t.raw_resolution || 'Rozlišení'}: {maxResolution === 0 ? (t.raw_res_original || 'Originál') : `${maxResolution}px`}
                            </p>

                            {conversionError && (
                                <div className="mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                                    <h4 className="text-sm font-bold text-red-300 mb-2">Chyby:</h4>
                                    <pre className="text-xs text-red-200 whitespace-pre-wrap">{conversionError}</pre>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {convertedFiles.map((file) => (
                                    <div key={file.convertedName} className="group relative aspect-square bg-elevated rounded-lg overflow-hidden shadow-md border border-border-subtle/50">
                                        <img src={file.url} alt={file.convertedName} className="w-full h-full object-contain" />
                                        <div className="absolute top-2 right-2">
                                            <div className="px-2 py-1 bg-void border border-border-subtle text-text-secondary text-xs flex flex-col items-end">
                                                <span className="font-medium text-text-primary">{file.width}x{file.height}</span>
                                                <span className="opacity-70 text-[10px]">{formatSize(file.originalSize)} → {file.sizeLabel}</span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => downloadBlob(file.blob, file.convertedName)} className="p-3 bg-elevated border border-border-subtle text-text-primary transition-none" title="Download">
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
                                    : `${t.raw_convert} ${rawFiles.length || ''}`
                                }
                            </button>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleDownloadAll}
                                    className="w-full inline-flex items-center justify-center px-6 py-4 border border-accent text-lg font-semibold text-void bg-accent transition-none"
                                >
                                    <ExportIcon className="mr-3 h-6 w-6" />
                                    {t.raw_save_folder || 'Stáhnout vše'} ({convertedFiles.length})
                                </button>
                                <button
                                    onClick={handleAddToProject}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-border-subtle text-sm font-medium text-text-primary bg-elevated hover:bg-accent/10 transition-colors"
                                >
                                    {t.raw_open_editor}
                                </button>
                                <button
                                    onClick={() => { setRawFiles([]); setConvertedFiles([]); setConversionError(''); }}
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
