import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getImages, uploadImage, getImageUrl } from "../api/projects";
import MatrixRain from "../components/MatrixRain";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [domain, setDomain] = useState("");
  const [uploadError, setUploadError] = useState(null);
  const [lightbox, setLightbox] = useState(null); // file_name of open image
  const fileInputRef = useRef(null);

  async function fetchImages() {
    const result = await getImages();
    if (result.ok) {
      setImages(result.files);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchImages();
  }, []);

  // close lightbox on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!domain.trim()) {
      setUploadError("enter the project's domain before uploading");
      e.target.value = "";
      return;
    }

    setUploadError(null);
    setUploading(true);

    const result = await uploadImage(file, domain.trim());

    if (result.ok) {
      await fetchImages();
    } else {
      setUploadError(result.error);
    }

    setUploading(false);
    // reset input so same file can be re-uploaded if needed
    e.target.value = "";
  }

  return (
    <div className="relative min-h-screen animate-fade-in">
      <MatrixRain />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="text-mutedtext text-sm hover:text-skyblue transition-colors"
          >
            ← back
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primarytext tracking-wider">
                HALL OF FAME
              </h1>
              <div
                className="h-0.5 w-48 mt-2"
                style={{ backgroundColor: "#fbbf24" }}
              />
              <p className="text-mutedtext text-xs mt-2">
                {images.length} {images.length === 1 ? "entry" : "entries"}
              </p>
            </div>

            {/* Upload button */}
            <div className="flex flex-col items-end gap-1">
              <label
                htmlFor="upload-domain"
                className="text-mutedtext text-xs self-start"
              >
                project domain
              </label>
              <input
                id="upload-domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                disabled={uploading}
                className="w-full rounded border border-cardborder bg-card px-3 py-2 text-sm text-primarytext focus:border-gold focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !domain.trim()}
                className={`btn-glow px-5 py-2.5 text-sm rounded border transition-all font-medium ${
                  uploading
                    ? "opacity-50 cursor-wait bg-gold/20 text-gold border-gold"
                    : !domain.trim()
                      ? "opacity-50 cursor-not-allowed bg-cardborder text-gold border-gold"
                      : "bg-cardborder text-gold border-gold hover:bg-gold/20"
                }`}
              >
                {uploading ? "uploading..." : "✦ add entry"}
              </button>
              {uploadError && (
                <p className="text-danger text-xs">! {uploadError}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-mutedtext text-sm animate-pulse">loading...</p>
        )}

        {/* Error */}
        {error && !loading && <p className="text-danger text-sm">! {error}</p>}

        {/* Empty state */}
        {!loading && !error && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-mutedtext text-sm">nothing here yet.</p>
            <p className="text-mutedtext/50 text-xs mt-1">
              add the first entry to start the hall of fame.
            </p>
          </div>
        )}

        {/* Image grid */}
        {!loading && !error && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightbox(img.file_name)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-cardborder hover:border-gold transition-all duration-200"
              >
                <img
                  src={getImageUrl(img.file_name)}
                  alt={img.file_name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* hover overlay */}
                <div className="absolute inset-0 bg-page/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <span className="text-gold text-xs tracking-widest">
                    view
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-page/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(lightbox)}
              alt={lightbox}
              className="max-w-full max-h-[85vh] object-contain rounded-lg border border-cardborder"
            />
            <button
              onClick={() => setLightbox(null)}
              aria-label="Close image"
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-card border border-cardborder text-mutedtext hover:text-danger text-sm flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            <p className="text-mutedtext text-xs text-center mt-2 font-mono truncate">
              {lightbox}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
