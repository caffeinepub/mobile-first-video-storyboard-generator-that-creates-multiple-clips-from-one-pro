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
      try {
        const result = reader.result as string;
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64Data = result.split(',')[1] || result;
        
        if (!base64Data) {
          throw new Error('Failed to extract base64 data from image');
        }
        
        resolve({
          data: base64Data,
          mimeType: file.type,
          filename: file.name,
          size: file.size
        });
      } catch (error) {
        reject(new Error(`Failed to encode image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read image file: ${file.name}. The file may be corrupted or inaccessible.`));
    };
    
    reader.readAsDataURL(file);
  });
}

export async function encodeImages(files: File[]): Promise<EncodedImage[]> {
  try {
    const encodingPromises = files.map(file => encodeImageToBase64(file));
    return await Promise.all(encodingPromises);
  } catch (error) {
    // Re-throw with context about reference images
    throw new Error(
      `Failed to encode reference images: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Try removing the images or using different image files.'
    );
  }
}
