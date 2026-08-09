import React from "react";
import { Handle, Position } from "@xyflow/react";
import { FileCode } from "lucide-react";

export default function LayerFileNode({ data }: { data: any }) {
  const { file, complexity, isGod, isDead, isSelected } = data;

  // Extract filename from full path safely
  const fileString = file || data.label || "";
  const filename = fileString.split(/[\\/]/).pop() || fileString;

  // Get file extension for icon color
  const ext = filename.split('.').pop()?.toLowerCase();
  const isTypeScript = ext === 'ts' || ext === 'tsx';
  const isJavaScript = ext === 'js' || ext === 'jsx';

  return (
    <div className={`p-2.5 rounded-xl border bg-zinc-950/80 backdrop-blur-md transition-all duration-200 shadow-md min-w-[170px] ${isSelected
        ? "border-primary text-primary bg-primary/5 shadow-primary/20"
        : "border-border/60 text-zinc-300 hover:border-zinc-400"
      }`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center gap-2 text-left">
        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isTypeScript ? 'text-blue-400' :
            isJavaScript ? 'text-yellow-400' :
              'text-zinc-500'
          }`} />
        <div className="flex flex-col min-w-0">
          <span className="text-[10.5px] font-mono font-bold truncate max-w-[130px]" title={fileString}>
            {filename}
          </span>
          {complexity > 0 && (
            <span className="text-[8px] text-zinc-500">
              Complexity: {complexity}
            </span>
          )}
        </div>
      </div>
      {(isGod || isDead) && (
        <div className="flex gap-1 mt-1.5">
          {isGod && (
            <span className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider">
              God
            </span>
          )}
          {isDead && (
            <span className="text-[7px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase tracking-wider">
              Dead
            </span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
