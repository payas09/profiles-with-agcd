import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ChatChannels from './components/ChatChannels';
import VoiceChannels from './components/VoiceChannels';
import ChannelEdit from './components/ChannelEdit';
import VoiceChannelEdit from './components/VoiceChannelEdit';
import ChannelExperiences from './components/ChannelExperiences';
import ConversationFlows from './components/ConversationFlows';
import ConversationFlowEdit from './components/ConversationFlowEdit';
import EngagementProfiles from './components/EngagementProfiles';
import EngagementProfileEdit from './components/EngagementProfileEdit';
import Queues from './components/Queues';
import QueueEdit from './components/QueueEdit';
import AgCDHome from './components/AgCDHome';
import AgCDPromptEdit from './components/AgCDPromptEdit';
import AgCDPlaybook from './components/AgCDPlaybook';
import { APP_CONFIG } from './config';
import './App.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isNonAgCDEditPage = location.pathname.startsWith('/channel/') ||
                            location.pathname.startsWith('/voice-channel/') ||
                            location.pathname.startsWith('/conversation-flow/') ||
                            location.pathname.startsWith('/engagement-profile/');

  if (isNonAgCDEditPage) {
    return (
      <>
        <Header />
        <div className="app app-no-sidebar">
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="app">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <div className={`main-content-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {children}
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router basename={APP_CONFIG.basePath}>
      <Layout>
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/chat-channels" element={<ChatChannels />} />
          <Route path="/voice-channels" element={<VoiceChannels />} />
          <Route path="/channel-experiences" element={<ChannelExperiences />} />
          <Route path="/conversation-flows" element={<ConversationFlows />} />
          <Route path="/engagement-profiles" element={<EngagementProfiles />} />
          <Route path="/queues" element={<Queues />} />
          <Route path="/queue/:id" element={<QueueEdit />} />
          <Route path="/channel/:id" element={<ChannelEdit />} />
          <Route path="/voice-channel/:id" element={<VoiceChannelEdit />} />
          <Route path="/conversation-flow/:id" element={<ConversationFlowEdit />} />
          <Route path="/engagement-profile/:id" element={<EngagementProfileEdit />} />
          <Route path="/agcd" element={<AgCDHome />} />
          <Route path="/agcd/prompt/:promptType" element={<AgCDPromptEdit />} />
          <Route path="/agcd/policy/:policyId" element={<AgCDPromptEdit />} />
          <Route path="/agcd/playbook" element={<AgCDPlaybook />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
