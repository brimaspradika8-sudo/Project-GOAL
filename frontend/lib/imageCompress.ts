import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

const MAX_WIDTH = 1920;
const COMPRESS_QUALITY = 0.85;

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(new Error('Gagal membaca dimensi gambar'))
    );
  });
}

export async function compressImageForUpload(
  uri: string,
  originalWidth?: number,
  originalHeight?: number
): Promise<{ uri: string; width: number; height: number }> {
  let width = originalWidth;
  let height = originalHeight;

  if (!width || !height) {
    const dims = await getImageDimensions(uri);
    width = dims.width;
    height = dims.height;
  }

  const actions: ImageManipulator.Action[] = [];
  if (width > MAX_WIDTH) {
    actions.push({ resize: { width: MAX_WIDTH } });
  }

  const result = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );

  return { uri: result.uri, width: result.width, height: result.height };
}
