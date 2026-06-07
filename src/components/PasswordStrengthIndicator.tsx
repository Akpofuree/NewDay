import { Check, X } from "lucide-react";

export interface PasswordRule {
  id: string;
  label: string;
  satisfied: boolean;
}

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      satisfied: password.length >= 8,
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      satisfied: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      satisfied: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      satisfied: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "One special character",
      satisfied: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function isPasswordStrong(password: string) {
  return getPasswordRules(password).every((rule) => rule.satisfied);
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const rules = getPasswordRules(password);
  const satisfiedCount = rules.filter((rule) => rule.satisfied).length;
  const progress = (satisfiedCount / rules.length) * 100;

  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full rounded-full bg-gray-200/80 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            satisfiedCount === rules.length
              ? "bg-emerald-500"
              : satisfiedCount >= 3
                ? "bg-amber-400"
                : "bg-red-400"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-[10px] font-semibold ${
              rule.satisfied
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {rule.satisfied ? (
              <Check size={11} className="shrink-0" />
            ) : (
              <X size={11} className="shrink-0" />
            )}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
