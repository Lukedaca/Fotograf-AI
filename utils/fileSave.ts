export type SupportedExportFormat = 'jpeg' | 'png';

const MIME_BY_FORMAT: Record<SupportedExportFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
};

const EXTENSION_BY_FORMAT: Record<SupportedExportFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
};

type SaveFilePicker = (options?: {
  suggestedName?: string;
  excludeAcceptAllOption?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

const getSaveFilePicker = (): SaveFilePicker | null => {
  if (typeof window === 'undefined') return null;

  const pickerWindow = window as Window & {
    showSaveFilePicker?: SaveFilePicker;
  };

  return pickerWindow.showSaveFilePicker ?? null;
};

export const supportsNativeSavePicker = (): boolean => getSaveFilePicker() !== null;

export const buildEditedFileName = (originalName: string, format: SupportedExportFormat): string => {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `edited_${baseName}.${EXTENSION_BY_FORMAT[format]}`;
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const saveBlobWithPicker = async (
  blob: Blob,
  fileName: string,
  format: SupportedExportFormat
) => {
  const savePicker = getSaveFilePicker();
  if (!savePicker) {
    throw new Error('SAVE_PICKER_UNSUPPORTED');
  }

  const handle = await savePicker({
    suggestedName: fileName,
    types: [
      {
        description: format.toUpperCase(),
        accept: {
          [MIME_BY_FORMAT[format]]: [`.${EXTENSION_BY_FORMAT[format]}`],
        },
      },
    ],
  });

  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
};
