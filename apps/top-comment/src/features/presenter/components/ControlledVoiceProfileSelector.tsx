import { useTTSContext } from "../../../shared/providers/TTSProvider";

interface ControlledVoiceProfileSelectorProps {
  value?: string;
  onChange: (profileId: string) => void;
}

export function ControlledVoiceProfileSelector({ value, onChange }: ControlledVoiceProfileSelectorProps) {
  const { selectedProfile, setProfile, availableProfiles } = useTTSContext();

  // Use the controlled value if provided, otherwise fall back to context
  const currentProfileId = value ?? selectedProfile?.id;
  const handleChange = onChange ?? setProfile;

  return (
    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-cyan-400">
        Announcer Profile
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {availableProfiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleChange(profile.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              currentProfileId === profile.id
                ? "bg-pink-500 text-white shadow-lg"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            title={profile.description}
          >
            {profile.name}
          </button>
        ))}
      </div>
    </div>
  );
}
