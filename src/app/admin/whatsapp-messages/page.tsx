"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { whatsappTemplatesApi } from "@/lib/services";
import {
  PLACEHOLDERS,
  renderTemplate,
  SAMPLE_BOOKING_VARS,
  setWhatsappTemplateCache,
  WHATSAPP_CATEGORIES,
  type WhatsappTemplate,
  type WhatsappTemplateCategory,
} from "@/lib/whatsappTemplates";
import {
  Alert,
  Button,
  Card,
  PageHeader,
} from "@/components/admin";

export default function WhatsappMessagesPage() {
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<WhatsappTemplateCategory>("booking_confirm");
  const [editing, setEditing] = useState<WhatsappTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { templates: rows } = await whatsappTemplatesApi.list();
      setTemplates(rows);
      setWhatsappTemplateCache(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryTemplates = useMemo(
    () => templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory],
  );

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setName("");
    setBody("");
  }

  function startEdit(template: WhatsappTemplate) {
    setCreating(false);
    setEditing(template);
    setName(template.name);
    setBody(template.body);
  }

  function cancelForm() {
    setCreating(false);
    setEditing(null);
    setName("");
    setBody("");
  }

  async function handleSave() {
    if (!name.trim() || !body.trim()) {
      setError("Name and message body are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (creating) {
        await whatsappTemplatesApi.create({
          category: activeCategory,
          name: name.trim(),
          body,
        });
      } else if (editing) {
        await whatsappTemplatesApi.update(editing.id, {
          name: name.trim(),
          body,
        });
      }
      cancelForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(template: WhatsappTemplate) {
    if (!confirm(`Delete "${template.name}"?`)) return;
    setError("");
    try {
      await whatsappTemplatesApi.remove(template.id);
      if (editing?.id === template.id) cancelForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  async function handleSetDefault(template: WhatsappTemplate) {
    setError("");
    try {
      await whatsappTemplatesApi.setDefault(template.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to set default");
    }
  }

  function insertPlaceholder(key: string) {
    setBody((prev) => `${prev}{{${key}}}`);
  }

  const preview = renderTemplate(body, SAMPLE_BOOKING_VARS);

  return (
    <>
      <PageHeader
        title="WhatsApp Messages"
        description="Manage message formats for booking confirm, customer assign, and driver assign"
      >
        <Button onClick={startCreate} className="w-full sm:w-auto">
          Add New Message
        </Button>
      </PageHeader>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {WHATSAPP_CATEGORIES.map((cat) => (
          <Button
            key={cat.key}
            type="button"
            variant={activeCategory === cat.key ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setActiveCategory(cat.key);
              cancelForm();
            }}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            Saved Messages
          </h2>
          {loading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : categoryTemplates.length === 0 ? (
            <p className="text-sm text-text-muted">No messages yet. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {template.name}
                    </span>
                    {template.is_default && (
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <pre className="mb-3 max-h-28 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">
                    {template.body}
                  </pre>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(template)}>
                      Edit
                    </Button>
                    {!template.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(template)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(template)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {(creating || editing) ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">
                {creating ? "Add New Message" : `Edit — ${editing?.name}`}
              </h2>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Message Name
                </label>
                <input
                  className="w-full rounded-lg border border-border bg-card-bg px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Short Format"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-text-primary">
                  Placeholders
                </p>
                <div className="flex flex-wrap gap-2">
                  {PLACEHOLDERS[activeCategory].map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="rounded-md border border-border bg-border-light px-2 py-1 text-xs text-text-secondary hover:bg-border"
                      onClick={() => insertPlaceholder(key)}
                    >
                      {`{{${key}}}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Message Body
                </label>
                <textarea
                  rows={14}
                  className="w-full rounded-lg border border-border bg-card-bg px-3 py-2 font-mono text-sm"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-text-primary">Preview</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-border-light/40 p-3 text-xs text-text-secondary">
                  {preview}
                </pre>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  className="w-full sm:w-auto"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelForm}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[16rem] items-center justify-center text-sm text-text-muted">
              Select a message to edit or click Add New Message
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
