export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function validateBase64Image(base64: string): boolean {
  const base64ImageRegex = /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,[A-Za-z0-9+/]+={0,2}$|^[A-Za-z0-9+/]+={0,2}$/;
  return base64ImageRegex.test(base64);
}
