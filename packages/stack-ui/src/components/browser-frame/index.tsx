import React from "react";

export type Props = {
  url?: string;
  padding?: string;
  children: React.ReactNode;
};

export const BrowserFrame = ({ url, padding, children }: Props) => (
  <div className="overflow-hidden rounded-xl shadow-2xl">
    <div className="box-border flex h-10 items-center bg-gray-200 px-4 py-2 dark:bg-gray-800">
      <div className="mr-1.5 h-3 w-3 flex-shrink-0 rounded-full bg-red-500" />
      <div className="mr-1.5 h-3 w-3 flex-shrink-0 rounded-full bg-yellow-500" />
      <div className="mr-2 h-3 w-3 flex-shrink-0 rounded-full bg-green-500" />
      {url && (
        <div
          className="ml-2 mr-4 h-6 flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap rounded-full bg-white px-4 text-left
            text-sm leading-6 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          aria-hidden
        >
          {url}
        </div>
      )}
      <div className="ml-auto flex h-4 w-4 flex-shrink-0 flex-col items-stretch justify-evenly">
        <span className="h-0.5 bg-gray-400 dark:bg-gray-500" />
        <span className="h-0.5 bg-gray-400 dark:bg-gray-500" />
        <span className="h-0.5 bg-gray-400 dark:bg-gray-500" />
      </div>
    </div>
    <div className={`flex flex-col rounded-b-md bg-white p-4 dark:bg-black ${padding ? padding : ""}`}>{children}</div>
  </div>
);
