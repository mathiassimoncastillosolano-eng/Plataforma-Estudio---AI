import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import TopicLayout from "./layouts/TopicLayout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TopicsListPage from "./pages/TopicsListPage";
import NewTopicPage from "./pages/NewTopicPage";
import TopicOverviewPage from "./pages/TopicOverviewPage";
import SummaryPage from "./pages/SummaryPage";
import QuestionsPage from "./pages/QuestionsPage";
import ExamPage from "./pages/ExamPage";
import ResultsPage from "./pages/ResultsPage";
import MindMapPage from "./pages/MindMapPage";
import ProgressPage from "./pages/ProgressPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/topics" element={<TopicsListPage />} />
        <Route path="/study/new" element={<NewTopicPage />} />

        <Route path="/study/:id" element={<TopicLayout />}>
          <Route index element={<TopicOverviewPage />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="exam" element={<ExamPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="mindmap" element={<MindMapPage />} />
        </Route>

        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
