import { useRef, useState } from 'react';
import { Check, ExternalLink, FileText, Image, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi, type PortfolioItem } from '@/modules/profile/api/profile.api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

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
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(selected.type)) {
      toast.error('Only image or PDF files are allowed.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB.');
      return;
    }

    setFile(selected);
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setFile(null);
    setEditingItem(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const startEditing = (item: PortfolioItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setUrl(item.url ?? '');
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle) {
      toast.error('Please enter a title.');
      return;
    }

    if (!trimmedUrl && !file && !editingItem?.fileUrl) {
      toast.error('Add a project URL or upload a certificate file.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        url: trimmedUrl || undefined,
        file: file ?? undefined,
      };

      if (editingItem) {
        await profileApi.updatePortfolio(editingItem._id, payload);
        toast.success('Portfolio item updated.');
      } else {
        await profileApi.createPortfolio(payload);
        toast.success('Portfolio item added.');
      }

      resetForm();
      onChange();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save portfolio item.');
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
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          <span className="min-w-0 truncate">
            Editing <span className="font-medium">{editingItem.title}</span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={resetForm} aria-label="Cancel editing">
            <X className="size-4" />
          </Button>
        </div>
      )}

      <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="portfolio-title">Title</Label>
          <Input
            id="portfolio-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="React portfolio, IELTS certificate..."
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolio-url">Project URL</Label>
          <Input
            id="portfolio-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/your-project"
            type="url"
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-w-10 px-3"
            onClick={() => inputRef.current?.click()}
            aria-label="Upload image or PDF"
            title="Upload image or PDF"
          >
            <Upload className="size-4" />
          </Button>
          <Button type="submit" disabled={saving} className="min-w-10 px-3" aria-label="Add portfolio item">
            {saving
              ? <Loader2 className="size-4 animate-spin" />
              : editingItem
                ? <Check className="size-4" />
                : <Plus className="size-4" />}
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {file && (
          <p className="text-xs text-muted-foreground md:col-span-3">
            Selected file: <span className="font-medium text-foreground">{file.name}</span>
          </p>
        )}
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No projects or certificates uploaded yet.
          </p>
        ) : (
          items.map((item) => {
            const fileName = normalizeFileName(item.fileName);

            return (
              <div
                key={item._id}
                className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {item.fileMimeType?.startsWith('image/')
                      ? <Image className="size-4 shrink-0 text-muted-foreground" />
                      : <FileText className="size-4 shrink-0 text-muted-foreground" />}
                    <p className="truncate font-medium">{item.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {item.url && (
                      <a
                        className="inline-flex items-center gap-1 hover:text-primary"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Project link <ExternalLink className="size-3" />
                      </a>
                    )}
                    {item.fileUrl && (
                      <a
                        className="inline-flex items-center gap-1 hover:text-primary"
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {fileName ?? 'Uploaded file'} <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(item)}
                  disabled={saving || deletingId === item._id}
                  aria-label={`Edit ${item.title}`}
                  title="Edit"
                >
                  <Pencil className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(item._id)}
                  disabled={deletingId === item._id}
                  aria-label={`Remove ${item.title}`}
                  title="Remove"
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
    </div>
  );
};
