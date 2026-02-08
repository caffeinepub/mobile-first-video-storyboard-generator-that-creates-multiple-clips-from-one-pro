// Utilities for encoding reference image files for API requests

export interface EncodedImage {
  data: string; // base64 encoded
  mimeType: string;
  filename: string;
  size: number;
}

export async function encodeImageToBase64(file: File): Promise<EncodedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = result.split(',')[1] || result;
      
      resolve({
        data: base64Data,
        mimeType: file.type,
        filename: file.name,
        size: file.size
      });
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    
    reader.readAsDataURL(file);
  });
}

export async function encodeImages(files: File[]): Promise<EncodedImage[]> {
  const encodingPromises = files.map(file => encodeImageToBase64(file));
  return Promise.all(encodingPromises);
}
