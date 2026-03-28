function FileMessage({ fileUrl, fileName, fileType }) {
  if (fileType === "image") {
    return (
      <div style={styles.imageWrapper}>
        <img
          src={fileUrl}
          alt={fileName}
          style={styles.image}
          onClick={() => window.open(fileUrl, "_blank")}
        />
      </div>
    )
  }

  if (fileType === "video") {
    return (
      <video controls style={styles.video}>
        <source src={fileUrl} />
      </video>
    )
  }

  // generic file
  return (
    <a href={fileUrl} target="_blank" rel="noreferrer" style={styles.fileCard}>
      <div style={styles.fileIcon}>📄</div>
      <div style={styles.fileInfo}>
        <div style={styles.fileName}>{fileName}</div>
        <div style={styles.fileDownload}>Click to download</div>
      </div>
    </a>
  )
}

const styles = {
  imageWrapper: { marginTop: "4px", cursor: "pointer" },
  image: {
    maxWidth: "260px",
    maxHeight: "200px",
    borderRadius: "10px",
    display: "block",
    objectFit: "cover"
  },
  video: { maxWidth: "260px", borderRadius: "10px", marginTop: "4px" },
  fileCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "10px 12px",
    marginTop: "4px",
    textDecoration: "none",
    color: "inherit",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  fileIcon: { fontSize: "24px" },
  fileInfo: { flex: 1 },
  fileName: { fontSize: "13px", fontWeight: "500", wordBreak: "break-all" },
  fileDownload: { fontSize: "11px", opacity: 0.7, marginTop: "2px" }
}

export default FileMessage
