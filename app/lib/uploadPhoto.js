
import cloudinary from "@/app/lib/cloudinary";

export function uploadPhoto(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "civicfix/reports",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}
