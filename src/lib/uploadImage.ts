import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system/next';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';

type PickKind = 'avatar' | 'banner';
type PickSource = 'camera' | 'gallery';

export async function pickImageFree(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  const ctx = ImageManipulator.manipulate(result.assets[0].uri);
  ctx.resize({ width: 800 });
  const image = await ctx.renderAsync();
  const compressed = await image.saveAsync({ compress: 0.75, format: SaveFormat.WEBP });
  return compressed.uri;
}

export async function pickAndCompress(source: PickSource, kind: PickKind): Promise<string | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: kind === 'avatar' ? [1, 1] : [3, 1],
    quality: 1,
  };

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets[0]) return null;

  const maxWidth = kind === 'avatar' ? 400 : 1200;
  const ctx = ImageManipulator.manipulate(result.assets[0].uri);
  ctx.resize({ width: maxWidth });
  const image = await ctx.renderAsync();
  const compressed = await image.saveAsync({ compress: 0.75, format: SaveFormat.WEBP });

  return compressed.uri;
}

export async function uploadCompressedImage(localUri: string, storagePath: string): Promise<string | null> {
  const file = new File(localUri);
  const bytes = await file.bytes();

  const { error } = await supabase.storage
    .from('usuarios')
    .upload(storagePath, bytes, { contentType: 'image/webp', upsert: true });

  if (error) {
    console.error('Supabase storage error:', error.message);
    return null;
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('usuarios')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10); // 10 years
  if (signErr || !signed?.signedUrl) {
    console.error('Supabase signed URL error:', signErr?.message);
    return null;
  }
  return signed.signedUrl;
}
