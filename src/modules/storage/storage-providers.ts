import { StorageProvider } from '@/modules/storage/interfaces/storage-provider.interface';
import { GoogleCloudStorage } from '@/modules/storage/providers/google-cloud-storage/google-cloud-storage';
import { Imagekit } from '@/modules/storage/providers/imagekit/imagekit';
import { Storage as GCS } from '@google-cloud/storage';
import env from 'env-var';
import ImageKit from 'imagekit';

export async function getStorageProviders(): Promise<StorageProvider[]> {
  return await Promise.all([getGoogleStorage(), getImagekit()]);
}

async function getGoogleStorage(): Promise<StorageProvider> {
  const GOOGLE_APPLICATION_CREDENTIALS = env
    .get('GOOGLE_APPLICATION_CREDENTIALS')
    .required()
    .asString();
  const STORAGE_PROVIDER_GOOGLE_CLOUD_STORAGE_BUCKET_NAME = env
    .get('STORAGE_PROVIDER_GOOGLE_CLOUD_STORAGE_BUCKET_NAME')
    .required()
    .asString();
  const storage = new GCS({
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  });
  const provider = new GoogleCloudStorage(
    storage,
    STORAGE_PROVIDER_GOOGLE_CLOUD_STORAGE_BUCKET_NAME,
  );
  await provider.initialize();
  return provider;
}

async function getImagekit(): Promise<StorageProvider> {
  const STORAGE_PROVIDER_IMAGEKIT_PUBLIC_KEY = env
    .get('STORAGE_PROVIDER_IMAGEKIT_PUBLIC_KEY')
    .required()
    .asString();
  const STORAGE_PROVIDER_IMAGEKIT_PRIVATE_KEY = env
    .get('STORAGE_PROVIDER_IMAGEKIT_PRIVATE_KEY')
    .required()
    .asString();
  const STORAGE_PROVIDER_IMAGEKIT_ENDPOINT = env
    .get('STORAGE_PROVIDER_IMAGEKIT_ENDPOINT')
    .required()
    .asString();
  const imagekit = new ImageKit({
    publicKey: STORAGE_PROVIDER_IMAGEKIT_PUBLIC_KEY,
    privateKey: STORAGE_PROVIDER_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: STORAGE_PROVIDER_IMAGEKIT_ENDPOINT,
  });
  const provider = new Imagekit(imagekit);
  return provider;
}
