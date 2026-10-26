import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function OperationStatus({ stage, notice, onCancel }) {
  const [spinner, setSpinner] = useState(false);
  useEffect(() => {
    setSpinner(false);
    if (!stage) return;
    const timer = setTimeout(() => setSpinner(true), 1000);
    return () => clearTimeout(timer);
  }, [stage]);
  return <div className="operation-status">
    <div role="status" aria-live="polite" aria-atomic="true">
      {spinner && <span className="spinner" aria-hidden="true" />} {stage || notice}
    </div>
    {stage && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
  </div>;
}
