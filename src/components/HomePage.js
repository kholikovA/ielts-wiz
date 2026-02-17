import React from 'react';
import HeroSection from './HeroSection';
import SkillsSection from './SkillsSection';

const HomePage = ({ setCurrentPage }) => (<><HeroSection setCurrentPage={setCurrentPage} /><SkillsSection setCurrentPage={setCurrentPage} /></>);

// ==================== URL ROUTING HELPERS ====================

export default HomePage;
