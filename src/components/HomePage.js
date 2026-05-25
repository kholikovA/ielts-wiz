import React from 'react';
import HeroSection from './HeroSection';
import SkillsSection from './SkillsSection';
import HowItWorks from './HowItWorks';
import FinalCTA from './FinalCTA';

const HomePage = ({ setCurrentPage }) => (
  <>
    <HeroSection setCurrentPage={setCurrentPage} />
    <SkillsSection setCurrentPage={setCurrentPage} />
    <HowItWorks />
    <FinalCTA setCurrentPage={setCurrentPage} />
  </>
);

export default HomePage;
