import React from "react";
import { Lock } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-green-500 blur-sm opacity-50" />
        <div className="relative flex items-center justify-center w-10 h-10 rounded-md bg-gradient-to-br from-indigo-600 to-green-600">
          <Lock className="w-5 h-5 text-white" />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Obscr</h1>
        <p className="text-xs text-muted-foreground -mt-1">Steganography & Encryption</p>
      </div>
    </div>
  );
};
