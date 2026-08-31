'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {GalleryImageUpload} from '@/components/molecules/GalleryImageUpload';
import { formatNepaliDateShort } from '@/lib/nepaliDate';

interface ChildImage {
    id: string;
    name: string;
    type: string;
    uploadedDate: string;
    url: string;
}

export default function ChildImagesPage() {
    const params = useParams();
    const childId = params.id as string;
    const [images, setImages] = useState<ChildImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                // Updated endpoint specifically for images
                const response = await fetch(`/api/children/${childId}/images`);
                if (!response.ok) throw new Error('Failed to fetch images');

                const data = await response.json();
                setImages(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (childId) {
            fetchImages();
        }
    }, [childId]);

    if (loading) return <div className="p-6 text-gray-600 animate-pulse">Loading images...</div>;
    if (error) return <div className="p-6 text-red-600 font-medium">Error: {error}</div>;

    return (
        <div className="">
            <h1 className="text-2xl font-bold mb-6">Child Images</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.length === 0 ? (
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-dashed">
                        No images saved for this child.
                    </p>
                ) : (<>
                    {images.map((img) => (
                        <div key={img.id} className="border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 flex flex-col">

                            {/* Image Container */}
                            <div className="aspect-square relative w-full bg-gray-100 border-b">
                                <img
                                    src={img.url}
                                    alt={img.name}
                                    className="object-cover w-full h-full"
                                    loading="lazy"
                                />
                            </div>

                            {/* Metadata */}
                            <div className="p-4 flex flex-col gap-1">
                                <h3 className="font-semibold text-sm text-gray-900 truncate" title={img.name}>
                                    {img.name}
                                </h3>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{img.type}</p>
                                    <p className="text-xs text-gray-500">{formatNepaliDateShort(img.uploadedDate)}</p>
                                </div>
                                <a
                                    href={img.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-3 inline-block"
                                >
                                    Open Original ↗
                                </a>
                            </div>

                        </div>

                    ))}
                </>
                )}
                <GalleryImageUpload />
            </div>

        </div>
    );
}