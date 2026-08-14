/**
 * Helper to process image file uploads seamlessly.
 * Converts uploaded File into a optimized Base64 Data URL or uploads to Supabase storage.
 */
export async function processImageUpload(
  file: File,
  uploadToSupabaseFn?: (file: File, folder?: string) => Promise<{ success: boolean; publicUrl: string }>
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, url: '', error: 'Please select a valid image file (PNG, JPG, WEBP, GIF).' };
    }

    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, url: '', error: 'Image size exceeds 10MB limit. Please select a smaller photo.' };
    }

    // Try Supabase Storage if function provided
    if (uploadToSupabaseFn) {
      const res = await uploadToSupabaseFn(file, 'avatars');
      if (res.success && res.publicUrl) {
        return { success: true, url: res.publicUrl };
      }
    }

    // Fallback to optimized Base64 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          resolve({ success: true, url: result });
        } else {
          resolve({ success: false, url: '', error: 'Failed to read image file.' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, url: '', error: 'Error reading image file.' });
      };
      reader.readAsDataURL(file);
    });
  } catch (err: any) {
    return { success: false, url: '', error: err.message || 'Image upload failed.' };
  }
}
