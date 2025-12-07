/**
 * Compresses and resizes an image file to an optimized WebP format.
 * @param file The input file (image)
 * @param maxWidth Max width (default 1920)
 * @param quality WebP quality (0-1, default 0.8)
 * @returns Promise resolving to the compressed File
 */
export const optimizeImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize logic
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context failure'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to WebP
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Compression failure'));
                        return;
                    }
                    // Create new File from Blob
                    const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                        type: "image/webp",
                        lastModified: Date.now(),
                    });

                    console.log(`Optimized: ${(file.size / 1024).toFixed(0)}KB -> ${(optimizedFile.size / 1024).toFixed(0)}KB`);
                    resolve(optimizedFile);
                }, 'image/webp', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
