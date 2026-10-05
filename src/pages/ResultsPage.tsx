import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useTopicContext } from "../layouts/topicContext";
import { loadLastResult, type StoredResult } from "../services/examService";
import Button from "../components/Button";
import { EmptyState } from "../components/States";
import ExamResultView from "../components/exam/ExamResultView";

export default function ResultsPage() {
  const { topic } = useTopicContext();
  const location = useLocation();
  const navigate = useNavigate();
  // El resultado llega por navegación; si se refresca la página, se recupera de la sesión.
  const state = (location.state as StoredResult | null) ?? loadLastResult(topic.id);

  if (!state) {
    return (
      <EmptyState
        title="Todavía no tienes un resultado que mostrar"
        description="Completa una prueba para ver aquí tu resultado y tu retroalimentación."
        action={<Button onClick={() => navigate(`/study/${topic.id}/exam`)}>Ir a la prueba</Button>}
        icon={<AlertTriangle size={22} />}
      />
    );
  }

  return <ExamResultView result={state.result} questions={state.questions} attempts={state.attempts} topicId={topic.id} />;
}
