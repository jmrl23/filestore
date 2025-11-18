export function generateRandomString(length: number): string {
  const CHARACTERS: string[] = [
    ...'0123456789',
    ...Array.from({ length: 26 }).map((_, index) =>
      String.fromCharCode(65 + index),
    ),
    ...Array.from({ length: 26 }).map((_, index) =>
      String.fromCharCode(97 + index),
    ),
  ];
  return Array.from({ length })
    .map(() => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)])
    .join('');
}
