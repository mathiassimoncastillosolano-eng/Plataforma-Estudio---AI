import { useMemo } from "react";
import type { ExamConfig, StudyQuestion } from "../../types";
import { countByDifficulty, planExam, secondsPerQuestion } from "../../utils/examBuilder";
import QuestionCountSelector from "./QuestionCountSelector";
import DifficultySelector from "./DifficultySelector";
import TimeSelector from "./TimeSelector";
import ExamSummary from "./ExamSummary";

interface Props {
  topicTitle: string;
  pool: StudyQuestion[];
  config: ExamConfig;
  onChange: (config: ExamConfig) => void;
  onStart: () => void;
}

/** Configurador de la prueba (izquierda) + resumen en vivo (derecha). */
export default function ExamConfigurator({ topicTitle, pool, config, onChange, onStart }: Props) {
  const plan = useMemo(() => planExam(countByDifficulty(pool), config.questionCount, config.difficulty), [pool, config.questionCount, config.difficulty]);
  const spq = secondsPerQuestion(config);

  return (
    <div className="exam-config">
      <section className="exam-config-main">
        <header className="exam-config-head">
          <h2>Configura tu prueba</h2>
          <p>
            Define cuántas preguntas, qué tan exigente y cuánto tiempo tendrás para <strong>{topicTitle}</strong>.
          </p>
        </header>

        <div className="cfg-section">
          <div className="cfg-label">
            <h3>Cantidad de preguntas</h3>
            <span>{pool.length} disponibles en este tema</span>
          </div>
          <QuestionCountSelector value={config.questionCount} available={pool.length} onChange={(questionCount) => onChange({ ...config, questionCount })} />
        </div>

        <div className="cfg-section">
          <div className="cfg-label">
            <h3>Dificultad</h3>
            <span>Define la mezcla real de preguntas</span>
          </div>
          <DifficultySelector value={config.difficulty} onChange={(difficulty) => onChange({ ...config, difficulty })} />
        </div>

        <div className="cfg-section">
          <div className="cfg-label">
            <h3>Tiempo</h3>
            <span>{spq === null ? "Sin cronómetro regresivo" : `≈ ${spq} s por pregunta`}</span>
          </div>
          <TimeSelector value={config.timeLimitMinutes} onChange={(timeLimitMinutes) => onChange({ ...config, timeLimitMinutes })} />
        </div>
      </section>

      <ExamSummary config={config} plan={plan} onStart={onStart} />
    </div>
  );
}
