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

export type NativeDirectoryHandle = {
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

type DirectoryPicker = (options?: {
  mode?: 'read' | 'readwrite';
}) => Promise<NativeDirectoryHandle>;

const getSaveFilePicker = (): SaveFilePicker | null => {
  if (typeof window === 'undefined') return null;

  const pickerWindow = window as Window & {
    showSaveFilePicker?: SaveFilePicker;
  };

  return pickerWindow.showSaveFilePicker ?? null;
};

const getDirectoryPicker = (): DirectoryPicker | null => {
  if (typeof window === 'undefined') return null;

  const pickerWindow = window as Window & {
    showDirectoryPicker?: DirectoryPicker;
  };

  return pickerWindow.showDirectoryPicker ?? null;
};

export const supportsNativeSavePicker = (): boolean => getSaveFilePicker() !== null;
export const supportsNativeDirectoryPicker = (): boolean => getDirectoryPicker() !== null;

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

export const pickDirectoryForSave = async (): Promise<NativeDirectoryHandle> => {
  const directoryPicker = getDirectoryPicker();
  if (!directoryPicker) {
    throw new Error('DIRECTORY_PICKER_UNSUPPORTED');
  }

  return directoryPicker({ mode: 'readwrite' });
};

export const saveBlobToDirectory = async (
  directoryHandle: NativeDirectoryHandle,
  blob: Blob,
  fileName: string
) => {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
};
