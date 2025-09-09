
export type AspectRatio = "9:16" | "1:1" | "16:9" | "3:4" | "4:3";

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
}
