import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PenLine, UploadCloud, X, Check, ArrowLeft } from "lucide-react";
import Button from "../components/Button";
import { Input } from "../components/Input";
import * as studyService from "../services/studyService";
import * as aiService from "../services/aiService";
import { formatFileSize } from "../utils/format";
import type { SourceDraft } from "../types";

type Step = "title" | "source" | "pdf" | "text" | "processing";

const CATEGORY_OPTIONS = ["Biología", "Historia", "Informática", "Matemáticas", "Física", "Química", "Idiomas", "Otra"];

export default function NewTopicPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("title");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [titleError, setTitleError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState("");

  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [creating, setCreating] = useState(false);

  const stepOrder: Step[] = ["title", "source", step === "pdf" ? "pdf" : "text"];
  const currentIndex = step === "title" ? 0 : step === "source" ? 1 : 2;

  function goToSource() {
    if (!title.trim()) {
      setTitleError("Ingresa el nombre del tema que quieres estudiar.");
      return;
    }
    setTitleError("");
    setStep("source");
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      alert("Por favor selecciona un archivo PDF.");
      return;
    }
    setFile(selected);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  }

  async function runProcessing(draft: SourceDraft) {
    setStep("processing");
    setCreating(true);
    setProcessingStepIndex(0);

    const totalSteps = aiService.processingSteps.length;
    for (let i = 0; i < totalSteps; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 750));
      setProcessingStepIndex(i + 1);
    }

    const newTopic = await studyService.createStudyTopic(draft);
    // Pre-generamos el resumen y las preguntas para que la navegación se sienta instantánea.
    await Promise.all([
      aiService.generateGeneralSummary(newTopic.id, newTopic.title),
      aiService.generateQuestions(newTopic.id, newTopic.title),
    ]);

    navigate(`/study/${newTopic.id}`);
  }

  function submitPdf() {
    if (!file) return;
    runProcessing({
      topicTitle: title,
      category,
      sourceType: "pdf",
      fileName: file.name,
      fileSizeLabel: formatFileSize(file.size),
    });
  }

  function submitText() {
    if (rawText.trim().length < 20) return;
    runProcessing({
      topicTitle: title,
      category,
      sourceType: "text",
      rawText,
    });
  }

  if (step === "processing") {
    return (
      <div className="processing-shell">
        <div className="processing-spinner" />
        <h2>Analizando tu material...</h2>
        <div className="checklist">
          {aiService.processingSteps.map((s, i) => {
            const isDone = i < processingStepIndex;
            const isActive = i === processingStepIndex;
            return (
              <div key={s.label} className={`checklist-item ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                <span className="checklist-icon">
                  {isDone && <Check size={13} />}
                  {isActive && !isDone && <span className="mono">●</span>}
                </span>
                {s.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flow-shell">
      <div className="flow-progress">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flow-progress-step ${i <= currentIndex ? "done" : ""}`} />
        ))}
      </div>

      {step === "title" && (
        <>
          <p className="flow-step-label">Paso 1 de 3</p>
          <h1 className="flow-title">¿Qué quieres estudiar?</h1>
          <p className="flow-subtitle">Dale un nombre claro a tu tema para que puedas encontrarlo fácilmente después.</p>

          <div className="stack gap-md">
            <Input
              label="Nombre del tema"
              placeholder="Ej. Sistema circulatorio humano"
              value={title}
              error={titleError}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <div className="field">
              <label>Categoría</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flow-footer">
            <span />
            <Button onClick={goToSource}>Continuar</Button>
          </div>
        </>
      )}

      {step === "source" && (
        <>
          <p className="flow-step-label">Paso 2 de 3</p>
          <h1 className="flow-title">¿Cómo quieres proporcionar el contenido?</h1>
          <p className="flow-subtitle">Puedes subir un documento PDF o escribir el contenido directamente.</p>

          <div className="source-choice-grid">
            <button className="source-choice-card" onClick={() => setStep("pdf")}>
              <div className="source-choice-icon">
                <FileText size={24} />
              </div>
              <span className="source-choice-title">PDF</span>
              <span className="source-choice-desc">Sube tu documento</span>
            </button>
            <div className="or-divider">O</div>
            <button className="source-choice-card" onClick={() => setStep("text")}>
              <div className="source-choice-icon">
                <PenLine size={24} />
              </div>
              <span className="source-choice-title">Texto</span>
              <span className="source-choice-desc">Escribe tu contenido</span>
            </button>
          </div>

          <div className="flow-footer">
            <Button variant="ghost" onClick={() => setStep("title")}>
              <ArrowLeft size={15} />
              Atrás
            </Button>
            <span />
          </div>
        </>
      )}

      {step === "pdf" && (
        <>
          <p className="flow-step-label">Paso 3 de 3</p>
          <h1 className="flow-title">Sube tu documento</h1>
          <p className="flow-subtitle">Aceptamos archivos PDF. No se envía a ningún servidor real: esta es una demo de frontend.</p>

          {!file ? (
            <div
              className={`dropzone ${dragging ? "dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="dropzone-icon">
                <UploadCloud size={24} />
              </div>
              <p style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>Arrastra tu PDF aquí</p>
              <p style={{ fontSize: 13 }}>o haz clic para seleccionar un archivo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="file-chip">
              <div className="file-chip-icon">
                <FileText size={18} />
              </div>
              <div className="file-chip-info">
                <div className="file-chip-name">{file.name}</div>
                <div className="file-chip-size">{formatFileSize(file.size)}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>
                <X size={14} />
                Eliminar
              </button>
            </div>
          )}

          <div className="flow-footer">
            <Button variant="ghost" onClick={() => setStep("source")}>
              <ArrowLeft size={15} />
              Atrás
            </Button>
            <Button onClick={submitPdf} disabled={!file}>
              Analizar contenido
            </Button>
          </div>
        </>
      )}

      {step === "text" && (
        <>
          <p className="flow-step-label">Paso 3 de 3</p>
          <h1 className="flow-title">Escribe tu contenido</h1>
          <p className="flow-subtitle">Pega o escribe el material que quieres que la IA analice.</p>

          <div className="field">
            <label>Contenido</label>
            <textarea
              className="textarea"
              placeholder="Pega o escribe aquí el contenido..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <div className="char-count">{rawText.length.toLocaleString()} caracteres</div>
          </div>

          <div className="flow-footer">
            <Button variant="ghost" onClick={() => setStep("source")}>
              <ArrowLeft size={15} />
              Atrás
            </Button>
            <Button onClick={submitText} disabled={rawText.trim().length < 20}>
              Analizar contenido
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
