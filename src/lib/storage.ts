import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
// Every extension we might have ever saved a given user's avatar under —
// swept before each new upload so switching file types never leaves an
// orphaned file behind in Storage.
const AVATAR_EXTENSIONS = ['jpg', 'png', 'webp', 'gif'];

export class AvatarValidationError extends Error {}

export function validateAvatarFile(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new AvatarValidationError('Please upload a JPG, PNG, WEBP, or GIF image.');
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new AvatarValidationError('Image must be smaller than 5MB.');
  }
}

function extensionForMimeType(mime: string): string {
  switch (mime) {
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    case 'image/jpeg':
    default: return 'jpg';
  }
}

async function deleteAllAvatarVariants(uid: string): Promise<void> {
  await Promise.all(
    AVATAR_EXTENSIONS.map((ext) =>
      deleteObject(ref(storage, `avatars/${uid}/avatar.${ext}`)).catch(() => {
        // Fine if it never existed — we're just making sure nothing stale is left behind.
      })
    )
  );
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  validateAvatarFile(file);
  await deleteAllAvatarVariants(uid);
  const ext = extensionForMimeType(file.type);
  const avatarRef = ref(storage, `avatars/${uid}/avatar.${ext}`);
  await uploadBytes(avatarRef, file, { contentType: file.type });
  return getDownloadURL(avatarRef);
}

export async function removeAvatar(uid: string): Promise<void> {
  await deleteAllAvatarVariants(uid);
}
