"use client";

import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * PageContainer provides consistent layout for all pages
 * Handles responsive spacing, typography, and content areas
 * Works seamlessly with MainLayout's sidebar responsiveness
 */
export default function PageContainer({
  children,
  title,
  description,
  className = "",
  headerClassName = "",
  contentClassName = "",
}: PageContainerProps) {
  return (
    <div className={`w-full max-w-full ${className}`}>
      {/* Page Header */}
      {(title || description) && (
        <div className={`mb-4 sm:mb-6 lg:mb-8 ${headerClassName}`}>
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Page Content */}
      <div className={`w-full max-w-full overflow-hidden ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
} 