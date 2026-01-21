import React from 'react';
import { useNavigation } from '../../hooks';
import { useAppSelector } from '../../store';
import { MdMenu, MdStore, MdPointOfSale } from 'react-icons/md';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { goTo } = useNavigation();
  const { currentBranch, user } = useAppSelector((state) => state.auth);
  const canAccessAllBranches = user?.role?.can_view_all_branches;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary-600/80 dark:bg-primary-700/80 backdrop-blur-md border-b border-primary-500/10 flex items-center justify-between px-4 lg:px-6 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-white/90 hover:text-white"
        >
          <MdMenu className="w-6 h-6" />
        </button>

        {/* Logo - visible on desktop when sidebar is fixed */}
        <button
          onClick={() => goTo('/dashboard')}
          className="hidden lg:flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-white/20 rounded-sm flex items-center justify-center backdrop-blur-sm">
            <MdStore className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-white">POS Multi</span>
        </button>
      </div>

      <div className="flex-1 lg:flex-none">
        {!canAccessAllBranches && currentBranch && (
          <span className="text-sm font-medium text-white/95">
            {currentBranch.name}
          </span>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Quick POS Access */}
        <button
          onClick={() => goTo('/pos')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-sm hover:bg-white/30 backdrop-blur-sm"
        >
          <MdPointOfSale className="w-5 h-5" />
          <span className="font-medium">POS</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
