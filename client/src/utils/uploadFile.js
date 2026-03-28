const uploadFile = async (file, cloudName, uploadPreset) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)

  // detect file type
  const isImage = file.type.startsWith("image/")
  const isVideo = file.type.startsWith("video/")
  const resourceType = isVideo ? "video" : isImage ? "image" : "raw"

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData }
  )

  const data = await res.json()

  return {
    fileUrl: data.secure_url,
    fileName: file.name,
    fileType: isImage ? "image" : isVideo ? "video" : "file"
  }
}

export default uploadFile
