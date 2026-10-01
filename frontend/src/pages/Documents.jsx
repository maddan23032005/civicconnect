import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Trash2, Eye, ShieldCheck, AlertTriangle,
  Clock, Sparkles, X, CheckCircle2, XCircle,
} from "lucide-react";
import { documentApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Reveal, Stagger, StaggerItem } from "../components/animation/Reveal";
import { Card, Button, Badge, Input, Select, Skeleton, EmptyState } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { PageLayout } from "../components/layout/PageLayout";

const STATUS_META = {
  pending:     { tone: "neutral", label: "Awaiting review",  icon: Clock },
  ai_reviewed: { tone: "saffron", label: "AI reviewed",      icon: Sparkles },
  verified:    { tone: "mint",    label: "Verified",         icon: ShieldCheck },
  rejected:    { tone: "rose",    label: "Rejected",         icon: XCircle },
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/* ---------------- Upload modal ---------------- */

function UploadModal({ types, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const toast = useToast();

  const pick = (f) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return setError("File must be under 8 MB");
    const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ok.includes(f.type)) return setError("Only JPG, PNG, WebP and PDF are accepted");
    setError("");
    setFile(f);
  };

  const submit = async () => {
    if (!file) return setError("Choose a file first");
    if (!documentType) return setError("Select the document type");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("documentType", documentType);
    if (documentNumber) fd.append("documentNumber", documentNumber);
    if (issuedOn) fd.append("issuedOn", issuedOn);

    setUploading(true);
    try {
      await documentApi.upload(fd, setProgress);
      toast.success("Document uploaded — AI verification is running");
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2"
      >
        <Card className="glass-strong p-7">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-white">Upload document</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
              <X size={19} />
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`mb-5 cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
              dragging ? "border-navy-500 bg-navy-500/10" : "border-white/15 hover:border-white/25"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => pick(e.target.files[0])}
            />
            {file ? (
              <div>
                <FileText size={26} className="mx-auto mb-2 text-mint-500" />
                <p className="text-sm font-medium text-slate-200">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatSize(file.size)}</p>
              </div>
            ) : (
              <div>
                <Upload size={26} className="mx-auto mb-2 text-slate-500" />
                <p className="text-sm text-slate-300">Drop a file here, or click to browse</p>
                <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP or PDF · up to 8 MB</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Select label="Document type" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="">Select type</option>
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Document number (optional)"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
              <Input
                label="Issued on (optional)"
                type="date"
                value={issuedOn}
                onChange={(e) => setIssuedOn(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}

            {uploading && progress > 0 && (
              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-navy-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <Button onClick={submit} loading={uploading} size="lg" className="w-full">
              <Upload size={17} /> Upload to locker
            </Button>

            <p className="text-center text-xs text-slate-600">
              Stored privately. Identifiers are masked before AI analysis.
            </p>
          </div>
        </Card>
      </motion.div>
    </>
  );
}

/* ---------------- AI verification panel ---------------- */

function VerificationPanel({ v }) {
  if (!v?.ranAt) {
    return (
      <div className="mt-4 flex items-center gap-2 border-t border-white/8 pt-4 text-xs text-slate-500">
        <Clock size={13} /> AI verification in progress…
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-white/8 pt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles size={13} className="text-saffron-500" />
        <span className="text-xs font-medium text-slate-300">AI verification</span>
        {v.confidence != null && (
          <Badge tone="saffron">{(v.confidence * 100).toFixed(0)}%</Badge>
        )}
        {v.recommendation && (
          <Badge tone={v.recommendation === "approve" ? "mint" : v.recommendation === "reject" ? "rose" : "navy"}>
            {v.recommendation.replace("_", " ")}
          </Badge>
        )}
      </div>

      {v.summary && <p className="mb-3 text-sm leading-relaxed text-slate-400">{v.summary}</p>}

      {v.matches?.length > 0 && (
        <div className="mb-2 space-y-1">
          {v.matches.map((m, i) => (
            <p key={i} className="flex items-center gap-2 text-xs text-mint-500">
              <CheckCircle2 size={11} /> {m.field} matches your profile
            </p>
          ))}
        </div>
      )}

      {v.mismatches?.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-rose-500/25 bg-rose-500/8 p-3">
          {v.mismatches.map((m, i) => (
            <div key={i} className="text-xs">
              <p className="flex items-center gap-2 font-medium text-rose-400">
                <AlertTriangle size={11} /> {m.field} — {m.severity}
              </p>
              <p className="mt-0.5 pl-5 text-slate-400">
                Document: {m.documentValue ?? "—"} · Record: {m.recordValue ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {v.extracted && Object.keys(v.extracted).length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400">
            Extracted fields
          </summary>
          <dl className="mt-2 space-y-1">
            {Object.entries(v.extracted).map(([k, val]) => (
              <div key={k} className="flex justify-between gap-3 text-xs">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right text-slate-300">{val ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */

const FALLBACK_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "ration_card", label: "Ration Card" },
  { value: "income_certificate", label: "Income Certificate" },
  { value: "community_certificate", label: "Community Certificate" },
  { value: "nativity_certificate", label: "Nativity Certificate" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "patta", label: "Patta / Land Record" },
  { value: "bank_passbook", label: "Bank Passbook" },
  { value: "disability_certificate", label: "Disability Certificate" },
  { value: "other", label: "Other Document" },
];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [types, setTypes] = useState(FALLBACK_TYPES);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const toast = useToast();

  const load = () =>
    documentApi.mine()
      .then((r) => setDocs(r.documents))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    documentApi.types()
      .then((r) => setTypes(r.documentTypes))
      .catch((err) => toast.error(`Could not load document types: ${err.message}`));
    load();
  }, []);

  // Poll while any document is still awaiting AI verification
  useEffect(() => {
    const awaiting = docs.some((d) => d.verificationStatus === "pending" && !d.aiVerification?.ranAt);
    if (!awaiting) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [docs]);

  const view = async (id) => {
    try {
      const r = await documentApi.viewUrl(id);
      window.open(r.url, "_blank", "noopener");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await documentApi.remove(id);
      toast.success("Document removed");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <PageLayout>
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <PageHeader
          icon={FileText}
          iconTone="text-mint-500"
          iconBg="bg-mint-500/10"
          title="Digital document locker"
          subtitle="Store certificates once — AI auto-verifies and pre-fills every future application"
          action={
            <Button variant="saffron" onClick={() => setShowUpload(true)}>
              <Upload size={17} /> Upload
            </Button>
          }
        />
      </Reveal>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : docs.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Your locker is empty"
            message="Upload your certificates once. They're checked automatically and reusable across every application."
            action={
              <Button variant="ghost" size="sm" onClick={() => setShowUpload(true)}>
                Upload your first document
              </Button>
            }
          />
        </Card>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {docs.map((d) => {
            const meta = STATUS_META[d.verificationStatus] || STATUS_META.pending;
            const Icon = meta.icon;

            return (
              <StaggerItem key={d.id}>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-100">{d.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {d.issuingAuthority || "—"} · {formatSize(d.sizeBytes)}
                      </p>
                    </div>
                    <Badge tone={meta.tone}>
                      <Icon size={10} /> {meta.label}
                    </Badge>
                  </div>

                  <VerificationPanel v={d.aiVerification} />

                  {d.officerNote && (
                    <p className="mt-3 rounded-lg bg-white/4 p-3 text-xs text-slate-300">
                      <span className="text-slate-500">Officer: </span>{d.officerNote}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2 border-t border-white/8 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => view(d.id)}>
                      <Eye size={14} /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(d.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <AnimatePresence>
        {showUpload && (
          <UploadModal types={types} onClose={() => setShowUpload(false)} onDone={load} />
        )}
      </AnimatePresence>
    </div>
    </PageLayout>
  );
}
