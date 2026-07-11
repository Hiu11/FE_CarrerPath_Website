import { useState } from 'react';
import { Check, Download, ExternalLink, Eye, FileText, Image, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi, type PortfolioItem } from '@/modules/profile/api/profile.api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface PortfolioManagerProps {
  items: PortfolioItem[];
  onChange: () => void;
}

const MOJIBAKE_PATTERN = /Ã|Â|Æ|Ä|áº|á»|â/;

const normalizeFileName = (fileName?: string) => {
  if (!fileName || !MOJIBAKE_PATTERN.test(fileName)) return fileName;

  try {
    const bytes = Uint8Array.from([...fileName].map((char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return fileName;
  }
};

export const PortfolioManager = ({ items, onChange }: PortfolioManagerProps) => {
  interface FormEntry {
    id: string;
    title: string;
    url: string;
    files: File[];
  }

  const [entries, setEntries] = useState<FormEntry[]>([
    { id: 'initial', title: '', url: '', files: [] }
  ]);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [deletingItemObj, setDeletingItemObj] = useState<PortfolioItem | null>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Fetch download failed, falling back to direct link', error);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fileItems = items.filter((item) => !!item.fileUrl);
  const allSelected = fileItems.length > 0 && selectedIds.length === fileItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(fileItems.map((item) => item._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDownloadSelected = async () => {
    const selectedItems = fileItems.filter((item) => selectedIds.includes(item._id));
    if (selectedItems.length === 0) {
      toast.error('Please select at least one certificate to download.');
      return;
    }

    setDownloading(true);
    toast.info(`Starting download of ${selectedItems.length} file(s)...`);

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        if (!item.fileUrl) continue;

        const nameOfFile = normalizeFileName(item.fileName) || `certificate_${item._id}`;
        await downloadFile(item.fileUrl, nameOfFile);

        if (i < selectedItems.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      toast.success('All downloads completed successfully!');
    } catch (err) {
      toast.error('Failed to download some certificates.');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: Math.random().toString(), title: '', url: '', files: [] }
    ]);
  };

  const removeEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const updateEntryField = (entryId: string, field: 'title' | 'url', value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, [field]: value } : e))
    );
  };

  const triggerFileInput = (entryId: string) => {
    const el = document.getElementById(`file-input-${entryId}`);
    if (el) (el as HTMLInputElement).click();
  };

  const handleFileFieldChange = (entryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    if (selectedFiles.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const validFiles: File[] = [];

    for (const f of selectedFiles) {
      if (!allowedTypes.includes(f.type)) {
        toast.error(`File "${f.name}" is not allowed. Only image or PDF files are allowed.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File "${f.name}" is over 10MB.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length > 0) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, files: [...e.files, ...validFiles] } : e))
      );
    }
  };

  const removeEntryFile = (entryId: string, fileIdx: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, files: e.files.filter((_, idx) => idx !== fileIdx) }
          : e
      )
    );
  };

  const resetForm = () => {
    setEntries([{ id: 'initial', title: '', url: '', files: [] }]);
    setEditingItem(null);
  };

  const startEditing = (item: PortfolioItem) => {
    setEditingItem(item);
    setEntries([
      {
        id: item._id,
        title: item.title,
        url: item.url ?? '',
        files: [],
      },
    ]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validation
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const trimmedTitle = entry.title.trim();
      const trimmedUrl = entry.url.trim();

      if (!trimmedTitle) {
        toast.error(`Please enter a title for certificate #${i + 1}.`);
        return;
      }

      if (!trimmedUrl && entry.files.length === 0 && (!editingItem || !editingItem.fileUrl)) {
        toast.error(`Add a project URL or upload certificate file(s) for certificate #${i + 1}.`);
        return;
      }
    }

    setSaving(true);
    let successCount = 0;

    try {
      if (editingItem) {
        const entry = entries[0];
        const payload = {
          title: entry.title.trim(),
          url: entry.url.trim() || undefined,
          file: entry.files[0] ?? undefined,
        };
        await profileApi.updatePortfolio(editingItem._id, payload);
        toast.success('Portfolio item updated.');
      } else {
        // Sequential uploads
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const trimmedTitle = entry.title.trim();
          const trimmedUrl = entry.url.trim();

          if (entry.files.length > 0) {
            for (let fIdx = 0; fIdx < entry.files.length; fIdx++) {
              const fileObj = entry.files[fIdx];
              const subTitle = entry.files.length === 1 ? trimmedTitle : `${trimmedTitle} (${fIdx + 1})`;

              toast.info(`Uploading "${fileObj.name}"...`);
              await profileApi.createPortfolio({
                title: subTitle,
                url: trimmedUrl || undefined,
                file: fileObj,
              });
              successCount++;
            }
          } else {
            toast.info(`Saving "${trimmedTitle}"...`);
            await profileApi.createPortfolio({
              title: trimmedTitle,
              url: trimmedUrl,
            });
            successCount++;
          }
        }
        toast.success(`Successfully added ${successCount} certificate(s)!`);
      }
      resetForm();
      onChange();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save portfolio items.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (portfolioId: string) => {
    setDeletingId(portfolioId);
    try {
      await profileApi.deletePortfolio(portfolioId);
      toast.success('Portfolio item removed.');
      onChange();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove portfolio item.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {editingItem && (
        <div className="flex items-center justify-between gap-3 border-2 border-foreground bg-accent text-accent-foreground p-3 rounded-[2px] text-sm font-mono uppercase tracking-wider">
          <span className="min-w-0 truncate">
            Editing: <span className="font-bold">{editingItem.title}</span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={resetForm} aria-label="Cancel editing" className="border-2 border-foreground rounded-[2px] bg-background hover:bg-muted p-1 size-7 flex items-center justify-center shrink-0">
            <X className="size-4" />
          </Button>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="relative p-4 border-2 border-foreground bg-muted/20 rounded-[4px] space-y-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-fadeIn"
            >
              {entries.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 border-2 border-foreground bg-destructive text-destructive-foreground rounded-[2px] p-1 size-7 flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                  onClick={() => removeEntry(entry.id)}
                  title="Remove this certificate entry"
                >
                  <X className="size-4" />
                </Button>
              )}

              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
                <div className="space-y-2">
                  <Label htmlFor={`title-${entry.id}`} className="font-mono text-xs uppercase tracking-wider">
                    Title {entries.length > 1 && `#${index + 1}`}
                  </Label>
                  <Input
                    id={`title-${entry.id}`}
                    value={entry.title}
                    onChange={(event) => updateEntryField(entry.id, 'title', event.target.value)}
                    placeholder="React portfolio, IELTS certificate..."
                    maxLength={120}
                    className="border-2 border-foreground bg-background rounded-[2px] font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`url-${entry.id}`} className="font-mono text-xs uppercase tracking-wider">Project URL</Label>
                  <Input
                    id={`url-${entry.id}`}
                    value={entry.url}
                    onChange={(event) => updateEntryField(entry.id, 'url', event.target.value)}
                    placeholder="https://github.com/your-project"
                    type="url"
                    className="border-2 border-foreground bg-background rounded-[2px] font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-10 h-10 px-3 border-2 border-foreground rounded-[2px] bg-background text-foreground hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] cursor-pointer"
                    onClick={() => triggerFileInput(entry.id)}
                    aria-label="Upload image or PDF"
                    title="Upload image or PDF"
                  >
                    <Upload className="size-4" />
                  </Button>
                  <input
                    id={`file-input-${entry.id}`}
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    className="hidden"
                    multiple
                    onChange={(event) => handleFileFieldChange(entry.id, event)}
                  />
                </div>
              </div>

              {entry.files.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-2 mt-1">
                  <p className="font-mono uppercase tracking-wider font-bold text-foreground">Selected files ({entry.files.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.files.map((f, fileIdx) => (
                      <div
                        key={`${f.name}-${fileIdx}`}
                        className="flex items-center gap-1.5 border-2 border-foreground bg-muted/50 px-2 py-1 rounded-[2px] font-mono"
                      >
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        {f.type.startsWith('image/') && (
                          <button
                            type="button"
                            className="text-primary hover:underline cursor-pointer font-medium"
                            onClick={() => setPreviewImage({ url: URL.createObjectURL(f), title: f.name })}
                          >
                            <Eye className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-destructive hover:text-red-700 cursor-pointer ml-1"
                          onClick={() => removeEntryFile(entry.id, fileIdx)}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {!editingItem && (
            <Button
              type="button"
              onClick={addEntry}
              className="border-2 border-foreground bg-background text-foreground hover:bg-muted font-mono font-bold text-xs uppercase tracking-wider rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4" /> Add another certificate
            </Button>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="sm:ml-auto min-w-[120px] py-3 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : editingItem ? (
              <>
                <Check className="size-4" />
                Update Item
              </>
            ) : (
              <>
                <Check className="size-4" />
                Save Certificates
              </>
            )}
          </Button>
        </div>
      </form>

      {fileItems.length > 0 && (
        <div className="flex flex-col gap-3 border-2 border-foreground bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between text-sm rounded-[2px]">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all-certs"
              className="size-4 rounded-sm border-2 border-foreground text-primary focus:ring-0 cursor-pointer accent-primary shrink-0"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            <Label htmlFor="select-all-certs" className="cursor-pointer font-mono font-bold uppercase tracking-wider text-foreground text-xs">
              Select all certificates ({fileItems.length})
            </Label>
          </div>
          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownloadSelected}
              disabled={downloading}
              className="h-8 flex items-center gap-2 border-2 border-foreground bg-primary text-primary-foreground font-mono font-bold text-xs uppercase rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Download Selected ({selectedIds.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No projects or certificates uploaded yet.
          </p>
        ) : (
          items.map((item) => {
            const fileName = normalizeFileName(item.fileName);
            const isImage = item.fileMimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(item.fileUrl ?? '');

            return (
              <div
                key={item._id}
                className="flex flex-col gap-3 border-2 border-foreground bg-card text-card-foreground p-4 sm:flex-row sm:items-center sm:justify-between rounded-[4px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)]"
              >
                <div className="min-w-0 flex items-center gap-3">
                  {item.fileUrl && (
                    <input
                      type="checkbox"
                      className="size-4 rounded-sm border-2 border-foreground text-primary focus:ring-0 cursor-pointer accent-primary shrink-0"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => toggleSelect(item._id)}
                      aria-label={`Select ${item.title}`}
                    />
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {isImage
                        ? <Image className="size-4 shrink-0 text-muted-foreground" />
                        : <FileText className="size-4 shrink-0 text-muted-foreground" />}
                      <p className="truncate font-medium font-mono">{item.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground font-mono">
                      {item.url && (
                        <a
                          className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Project link <ExternalLink className="size-3" />
                        </a>
                      )}
                      {item.fileUrl && (
                        isImage ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-primary hover:underline cursor-pointer text-left font-normal border-none bg-transparent p-0 text-muted-foreground font-mono"
                            onClick={() => setPreviewImage({ url: item.fileUrl!, title: item.title })}
                          >
                            {fileName ?? 'Uploaded file'} <Eye className="size-3" />
                          </button>
                        ) : (
                          <a
                            className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {fileName ?? 'Uploaded file'} <ExternalLink className="size-3" />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(item)}
                    disabled={saving || deletingId === item._id}
                    aria-label={`Edit ${item.title}`}
                    title="Edit"
                    className="border-2 border-foreground bg-background rounded-[2px] p-2 hover:bg-muted"
                  >
                    <Pencil className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingItemObj(item)}
                    disabled={deletingId !== null}
                    aria-label={`Remove ${item.title}`}
                    title="Remove"
                    className="border-2 border-foreground bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-[2px] p-2"
                  >
                    {deletingId === item._id
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Trash2 className="size-4" />}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-3xl p-6 overflow-hidden flex flex-col items-center bg-card text-card-foreground border-2 border-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
          <DialogHeader className="w-full text-left border-b border-foreground/15 pb-2 mb-4">
            <DialogTitle className="text-lg font-mono font-bold uppercase tracking-wider">{previewImage?.title}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full max-h-[70vh] flex items-center justify-center overflow-auto mt-4 border-2 border-foreground bg-muted p-2 rounded-[2px]">
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[60vh] object-contain rounded-md"
              />
            )}
          </div>
          <div className="w-full flex justify-end gap-2 mt-4">
            <Button
              type="button"
              className="border-2 border-foreground bg-background text-foreground hover:bg-muted font-mono font-bold text-xs uppercase tracking-wider rounded-[2px] cursor-pointer"
              onClick={() => {
                if (previewImage) {
                  const link = document.createElement('a');
                  link.href = previewImage.url;
                  link.target = '_blank';
                  link.rel = 'noreferrer';
                  link.click();
                }
              }}
            >
              Open in new tab
            </Button>
            <Button
              type="button"
              className="border-2 border-foreground bg-primary text-primary-foreground font-mono font-bold text-xs uppercase tracking-wider rounded-[2px] cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
              onClick={() => setPreviewImage(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingItemObj} onOpenChange={(open) => { if (!open) setDeletingItemObj(null); }}>
        <DialogContent className="max-w-md p-6 overflow-hidden flex flex-col items-center bg-card text-card-foreground border-2 border-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
          <DialogHeader className="w-full text-left border-b border-foreground/15 pb-2 mb-4">
            <DialogTitle className="text-lg font-mono font-bold uppercase tracking-wider text-destructive">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="w-full text-sm font-mono leading-normal text-muted-foreground mb-6">
            Are you sure you want to remove the certificate <span className="font-bold text-foreground">"{deletingItemObj?.title}"</span>? This action cannot be undone.
          </div>
          <div className="w-full flex justify-end gap-3">
            <Button
              type="button"
              className="border-2 border-foreground bg-background text-foreground hover:bg-muted font-mono font-bold text-xs uppercase tracking-wider rounded-[2px] cursor-pointer"
              onClick={() => setDeletingItemObj(null)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="border-2 border-foreground bg-destructive text-destructive-foreground font-mono font-bold text-xs uppercase tracking-wider rounded-[2px] cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all flex items-center gap-2"
              onClick={() => {
                if (deletingItemObj) {
                  void handleDelete(deletingItemObj._id);
                  setDeletingItemObj(null);
                }
              }}
              disabled={deletingId !== null}
            >
              {deletingId ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
