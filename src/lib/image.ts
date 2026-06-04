/**
 * Resizes an image file client-side using HTML5 Canvas.
 * Returns a Promise that resolves to a JPEG Blob.
 */
export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<Blob> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    // Only process image files
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        // Draw resized image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG blob with quality setting
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to generate image blob"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };
  });
}
