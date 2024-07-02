import * as React from "react";

export type Props = {
  url?: string,
  padding?: string,
  children: React.ReactNode,
};

export const BrowserFrame = ({ url, padding, children }: Props) => (
  <div className="rounded-xl overflow-hidden shadow-2xl">
    <div className="bg-gray-200 dark:bg-gray-800 h-10 flex items-center py-2 px-4 box-border">
      <div className="w-3 h-3 bg-red-500 rounded-full mr-1.5 flex-shrink-0" />
      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1.5 flex-shrink-0" />
      <div className="w-3 h-3 bg-green-500 rounded-full mr-2 flex-shrink-0" />
      {url && (
        <div
          className="text-left bg-white dark:bg-gray-700 h-6 rounded-full leading-6 text-sm text-gray-700 dark:text-gray-300 flex-grow ml-2 mr-4 px-4 whitespace-nowrap overflow-hidden overflow-ellipsis"
          aria-hidden
        >
          {url}
        </div>
      )}
      <div className="w-4 h-4 ml-auto flex flex-col justify-evenly items-stretch flex-shrink-0">
        <span className="h-0.5 bg-gray-400 dark:bg-gray-500" />
        <span className="h-0.5 bg-gray-400 dark:bg-gray-500" />
        <span className="h-0.5 bg-gray-400 dark:bg-gray-500" />
      </div>
    </div>
    <div className={`flex flex-col p-4 bg-white dark:bg-black rounded-b-md ${padding ? padding : ""}`}>
      {children}
    </div>
  </div>
);
