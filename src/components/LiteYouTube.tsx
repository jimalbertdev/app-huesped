import { useState } from 'react';
import '../styles/lite-youtube.css';

interface LiteYouTubeProps {
    videoUrl: string;
    title?: string;
    className?: string;
}

/**
 * Componente Lite YouTube Embed
 * Carga solo una imagen de vista previa hasta que el usuario hace clic,
 * mejorando significativamente el rendimiento de la página.
 */
export const LiteYouTube = ({ videoUrl, title = 'Video', className = '' }: LiteYouTubeProps) => {
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);

    // Extraer el ID del video de diferentes formatos de URL de YouTube
    const extractVideoId = (url: string): string | null => {
        if (!url) return null;

        // Formato: https://www.youtube.com/watch?v=VIDEO_ID
        const standardMatch = url.match(/[?&]v=([^&]+)/);
        if (standardMatch) return standardMatch[1];

        // Formato: https://youtu.be/VIDEO_ID
        const shortMatch = url.match(/youtu\.be\/([^?]+)/);
        if (shortMatch) return shortMatch[1];

        // Formato: https://www.youtube.com/embed/VIDEO_ID
        const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
        if (embedMatch) return embedMatch[1];

        return null;
    };

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
        return (
            <div className="lite-youtube-error">
                <p>URL de video inválida</p>
            </div>
        );
    }

    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

    const handlePlayClick = () => {
        setIsIframeLoaded(true);
    };

    return (
        <div className={`lite-youtube ${className}`}>
            {!isIframeLoaded ? (
                <div className="lite-youtube-preview" onClick={handlePlayClick}>
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="lite-youtube-thumbnail"
                        loading="lazy"
                    />
                    <button
                        className="lite-youtube-play-button"
                        aria-label={`Reproducir ${title}`}
                        type="button"
                    >
                        <svg viewBox="0 0 68 48" width="68" height="48">
                            <path
                                d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
                                fill="#f00"
                            />
                            <path d="M 45,24 27,14 27,34" fill="#fff" />
                        </svg>
                    </button>
                </div>
            ) : (
                <iframe
                    src={iframeSrc}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="lite-youtube-iframe"
                />
            )}
        </div>
    );
};
