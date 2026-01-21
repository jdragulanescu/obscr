import React, { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import zxcvbn from "zxcvbn";

export const PasswordInput = ({ label, value, onChange, showStrength = true }) => {
  const [visible, setVisible] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce the password value for analysis
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const passwordAnalysis = useMemo(() => {
    if (!debouncedValue || debouncedValue.length === 0) {
      return { score: 0, crackTime: "", strengthLabel: "No password" };
    }

    const result = zxcvbn(debouncedValue);
    const crackTime = result.crack_times_display.offline_slow_hashing_1e4_per_second;

    // Adjust score to be harsher for offline brute-force scenarios
    // Since there's no rate limiting, we need stronger passwords
    let adjustedScore = result.score;

    // Downgrade scores based on crack time thresholds
    if (result.guesses < 1e8) {
      // Less than 100 million guesses = too weak
      adjustedScore = 0;
    } else if (result.guesses < 1e10) {
      // Less than 10 billion guesses = very weak
      adjustedScore = Math.min(adjustedScore, 1);
    } else if (result.guesses < 1e12) {
      // Less than 1 trillion guesses = weak
      adjustedScore = Math.min(adjustedScore, 2);
    }

    const strengthLabels = [
      "Too weak",           // 0 - Crackable in minutes/hours
      "Weak",               // 1 - Crackable in days
      "Fair",               // 2 - Crackable in months
      "Strong",             // 3 - Crackable in years
      "Very strong"         // 4 - Crackable in centuries
    ];

    return {
      score: adjustedScore,
      crackTime: crackTime,
      strengthLabel: strengthLabels[adjustedScore],
      feedback: result.feedback.warning || result.feedback.suggestions[0],
    };
  }, [debouncedValue]);

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="password-input-row">
        <div className="password-input-wrapper">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="password-input-field"
          />
          <button
            type="button"
            className="password-toggle"
            onMouseDown={() => setVisible(true)}
            onMouseUp={() => setVisible(false)}
            onMouseLeave={() => setVisible(false)}
            onTouchStart={() => setVisible(true)}
            onTouchEnd={() => setVisible(false)}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {showStrength && (
          <div className="password-strength-compact">
            <div className={`bar bar-${passwordAnalysis.score}`} />
            <div className="strength-info">
              <span className="label">{passwordAnalysis.strengthLabel}</span>
              <span className="crack-time">
                {value && passwordAnalysis.crackTime ? `Crack time: ${passwordAnalysis.crackTime}` : '\u00A0'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

