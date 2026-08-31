'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Trash2, DownloadCloud } from 'lucide-react';
import { formatNepaliDateShort } from '@/lib/nepaliDate';

interface ChildDocument {
    id: string;
    name: string;
    type: string;
    uploadedDate: string;
    url: string;
}

export default function ChildDocumentsPage() {
    const params = useParams();
    const childId = params.id as string;
    const [documents, setDocuments] = useState<ChildDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch(`/api/children/${childId}/documents`);
                if (!response.ok) throw new Error('Failed to fetch documents');
                
                const data = await response.json();
                setDocuments(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (childId) fetchDocuments();
    }, [childId]);

    const handleDelete = async (docId: string, url: string) => {
        if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) return;

        setDeletingId(docId);
        try {
            const response = await fetch(`/api/children/${childId}/documents`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }), // We pass the URL to identify which string to remove
            });

            if (!response.ok) throw new Error('Failed to delete document');

            // Instantly remove from UI
            setDocuments(docs => docs.filter(doc => doc.id !== docId));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="p-6 text-text-muted animate-pulse font-mono tracking-widest text-sm">FETCHING_VAULT_DATA...</div>;
    if (error) return <div className="p-6 text-danger font-bold bg-danger/10 border border-danger/20 rounded-xl m-6">⚠️ Error: {error}</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-text tracking-tighter">Legal & Medical Files</h1>
                <p className="text-sm text-text-muted mt-1 font-medium">This child's documents</p>
            </div>
            
            {documents.length === 0 ? (
                <div className="bg-shaded/50 border border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-text-muted/50 mb-3" />
                    <p className="text-text-muted font-bold tracking-tight">No documents on file.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                        <div 
                            key={doc.id} 
                            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-border hover:shadow-glow transition-all group"
                        >
                            {/* Left Side: Icon & Info */}
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col truncate">
                                    <h3 className="font-bold text-sm text-text truncate" title={doc.name}>
                                        {doc.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-text-muted bg-bg px-2 py-0.5 rounded border border-border">
                                            {doc.type}
                                        </span>
                                        <span className="text-[10px] text-text-muted/70 font-mono">
                                            {formatNepaliDateShort(doc.uploadedDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Actions */}
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-primary/10 hover:text-primary transition-colors"
                                    title="Download / View"
                                >
                                    <DownloadCloud className="w-4 h-4" />
                                </a>

                                <button 
                                    onClick={() => handleDelete(doc.id, doc.url)}
                                    disabled={deletingId === doc.id}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50 transition-colors"
                                    title="Delete Document"
                                >
                                    {deletingId === doc.id ? (
                                        <span className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}