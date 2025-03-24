import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';

interface BreadcrumbProps {
  paths: string[];
  onNavigate: (index: number) => void;
}

export const Breadcrumb = ({ paths, onNavigate }: BreadcrumbProps) => {
  return (
    <nav className="breadcrumb" aria-label="面包屑导航">
      <button
        onClick={() => onNavigate(0)}
        className="flex items-center hover:text-primary-600"
      >
        <HomeIcon className="w-4 h-4 mr-1" />
        首页
      </button>
      {paths.map((path, index) => (
        <div key={index} className="flex items-center">
          <ChevronRightIcon className="breadcrumb-separator w-4 h-4 mx-2" />
          <button
            onClick={() => onNavigate(index + 1)}
            className="hover:text-primary-600"
          >
            {path}
          </button>
        </div>
      ))}
    </nav>
  );
}; 