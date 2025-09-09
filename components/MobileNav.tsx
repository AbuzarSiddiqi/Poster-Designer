import React from 'react';
import { Icon } from './common/Icon';

type MobileView = 'controls' | 'workspace' | 'gallery';

interface MobileNavProps {
  activeView: MobileView;
  setActiveView: (view: MobileView) => void;
}

const NavButton: React.FC<{
    label: string;
    icon: 'edit' | 'sparkles' | 'gallery';
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
                isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-300'
            }`}
        >
            <Icon icon={icon} className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
};


const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md border-t border-cyan-500/20 flex justify-around items-center z-40 h-16">
      <NavButton
        label="Create"
        icon="edit"
        isActive={activeView === 'controls'}
        onClick={() => setActiveView('controls')}
      />
      <NavButton
        label="Workspace"
        icon="sparkles"
        isActive={activeView === 'workspace'}
        onClick={() => setActiveView('workspace')}
      />
      <NavButton
        label="Gallery"
        icon="gallery"
        isActive={activeView === 'gallery'}
        onClick={() => setActiveView('gallery')}
      />
    </nav>
  );
};

export default MobileNav;
