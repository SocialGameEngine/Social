import { Link } from "react-router-dom";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { Card } from "@social/ui";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";

// ============================================================================
// BAR BRANDING CONFIGURATION
// ============================================================================
// Modify these values to customize the page for different bars
const barConfig = {
  // Bar Information
  name: "SÖCIAL",
  subtitle: "PUB",
  websiteUrl: "https://playnow.social",
  websiteLabel: "Visit Söcial Website",
  
  // Logo Configuration
  logo: {
    primaryUrl: "/logo.png",
    fallbackUrl: "/logo.png",
    altText: "Söcial",
    height: "h-24", // Tailwind height class
    styles: {
      light: {
        background: "bg-amber-50",
        hoverBackground: "hover:bg-amber-100",
        shadow: "shadow-inner",
      },
      dark: {
        background: "bg-slate-700/80",
        hoverBackground: "hover:bg-slate-600/80",
        shadow: "shadow-inner shadow-cyan-500/20",
      },
    },
  },
  
  // Game Branding
  gameName: "Söcial Games",
  
  // Color Scheme
  colors: {
    // Background gradients (Tailwind classes)
    background: {
      from: "",
      via: "",
      to: "",
    },
    // Accent colors for decorative elements (full Tailwind classes)
    accent: {
      primary: "to-amber-500",
      primaryBg: "bg-amber-500",
      secondary: "bg-red-600/20",
      tertiary: "bg-amber-500/20",
    },
    // Text colors
    text: {
      primary: "text-slate-900",
      secondary: "text-slate-600",
      accent: "text-amber-600",
      accentLight: "text-amber-500",
      muted: "text-slate-500",
      mutedLight: "text-slate-400",
    },
    // Button colors
    buttons: {
      primary: {
        from: "from-red-700",
        via: "via-white-700",
        to: "to-amber-800",
        hoverFrom: "hover:from-amber-600",
        hoverTo: "hover:to-red-700",
        border: "border-red-600/50",
        shadow: "shadow-red-900/50",
        focus: "focus-visible:outline-amber-500",
      },
      secondary: {
        border: "border-amber-500",
        hoverBorder: "hover:border-amber-400",
        from: "from-amber-900/80",
        to: "to-amber-800/80",
        hoverFrom: "hover:from-amber-800",
        hoverTo: "hover:to-amber-700",
        text: "text-amber-100",
        shadow: "shadow-amber-900/20",
        focus: "focus-visible:outline-amber-500",
      },
      tertiary: {
        border: "border-amber-200",
        hoverBorder: "hover:border-amber-300",
        background: "bg-white",
        hoverBackground: "hover:bg-amber-50",
        text: "text-slate-800",
        focus: "focus-visible:outline-amber-500",
      },
      // Special game action buttons
      startGame: {
        light: {
          gradient: "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300",
          text: "text-slate-900",
          shadow: "shadow-xl shadow-amber-500/30",
          focus: "focus-visible:outline-amber-500",
          hover: "hover:from-amber-600 hover:via-amber-500 hover:to-yellow-400 hover:text-slate-800 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-[1.05]",
        },
        dark: {
          gradient: "bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-300",
          text: "text-slate-900",
          shadow: "shadow-xl shadow-cyan-500/30",
          focus: "focus-visible:outline-cyan-500",
          hover: "hover:from-cyan-600 hover:via-cyan-500 hover:to-teal-400 hover:text-slate-800 hover:shadow-2xl hover:shadow-cyan-500/50 hover:scale-[1.05]",
        },
      },
      joinGame: {
        light: {
          gradient: "bg-gradient-to-r from-red-900 via-red-700 to-red-600",
          text: "text-white",
          shadow: "shadow-lg shadow-red-500/30",
          focus: "focus-visible:outline-amber-400",
          hover: "hover:bg-red-800 hover:text-yellow-300 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.05]",
        },
        dark: {
          gradient: "bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-500",
          text: "text-white",
          shadow: "shadow-lg shadow-pink-500/30",
          focus: "focus-visible:outline-pink-500",
          hover: "hover:from-pink-700 hover:via-fuchsia-700 hover:to-pink-600 hover:text-cyan-200 hover:shadow-xl hover:shadow-pink-500/50 hover:scale-[1.05]",
        },
      },
      auth: {
        light: {
          border: "border-amber-200",
          background: "bg-white",
          text: "text-slate-800",
          shadow: "shadow-lg shadow-amber-500/20",
          hoverBorder: "hover:border-amber-300",
          hoverBackground: "hover:bg-amber-50",
          hoverText: "hover:text-slate-900",
          hoverShadow: "hover:shadow-xl hover:shadow-amber-500/40",
          hoverScale: "hover:scale-[1.02]",
          focus: "focus-visible:outline-amber-400",
        },
        dark: {
          border: "border-cyan-400/50",
          background: "bg-slate-800/60",
          text: "text-cyan-100",
          shadow: "shadow-lg shadow-cyan-500/20",
          hoverBorder: "hover:border-cyan-300",
          hoverBackground: "hover:bg-slate-700/60",
          hoverText: "hover:text-white",
          hoverShadow: "hover:shadow-xl hover:shadow-cyan-500/40",
          hoverScale: "hover:scale-[1.02]",
          focus: "focus-visible:outline-cyan-400",
        },
      },
    },
    badge: {
      border: "border-amber-500/30",
      backgroundFrom: "from-red-900/40",
      backgroundTo: "to-amber-900/40",
      text: "text-amber-300",
    },
    decorativeOrbs: {
      primary: "bg-red-600/20",
      secondary: "bg-amber-500/20",
    },
    icons: {
      accent: "text-amber-500",
      hover: "hover:text-amber-400",
    },
  },
  
  content: {
    tagline: "Play with the bar, not just at the bar.",
    description: "Join live, crowd-powered games. Vote. Score. Win. Make friends.",
  },
  
  contact: {
    address: "123 Main St, Anytown, USA",
    phone: "(123) 456-7890",
  },
  
  buttons: {
    startGame: "Start a Game",
    joinGame: "Join a Game",
    createAccount: "Create Account",
    signIn: "Sign In / Sign Up",
  },
};

// ============================================================================

export function EntryPage() {
  const { isGuest } = useAuth();
  const { isDark } = useTheme();

  const showBackground = true;
  return (
    <>
      <BackgroundAnimation show={showBackground} />
      {showBackground && (
        <style>{`
          body {
            background: transparent !important;
          }
        `}</style>
      )}
      <main className="relative min-h-screen px-4 py-10 sm:px-6">
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6">
          <Card className="text-center space-y-4 backdrop-blur" isDark={isDark}>
            {/* New Pub Söcial Branding */}
            <div className="mx-auto flex justify-center mb-6">
              <div className="flex items-center gap-4">
                {/* Martini SVG Icon */}
                <svg 
                  width="72" 
                  height="72" 
                  viewBox="0 0 32 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${!isDark ? 'text-cyan-500' : 'text-cyan-300'}`}
                  style={{
                    filter: !isDark 
                      ? 'drop-shadow(0 0 2px #06b6d4) drop-shadow(0 0 4px rgba(6, 182, 212, 0.1))'
                      : 'drop-shadow(0 0 2px #67e8f9) drop-shadow(0 0 4px rgba(103, 232, 249, 0.1))'
                  }}
                >
                  {/* Cocktail glass outline */}
                  <path 
                    d="M22.9996 7H12.9996H7.00061L11.2406 11.24L18.0006 18L28.9996 7H22.9996Z" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  
                  {/* Glass bowl */}
                  <path 
                    d="M13 7H7L11.24 11.24C10.16 12.33 8.66 13 7 13C3.69 13 1 10.31 1 7C1 3.69 3.69 1 7 1C10.31 1 13 3.69 13 7Z" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  
                  {/* Glass stem and base */}
                  <path 
                    d="M11 30.9998H25M18 30.9998V17.9998L29 6.99981H7.00002L16 15.9998" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Decorative olive/cherry on rim */}
                  <path 
                    d="M12.2051 4.01351C11.1701 2.21251 9.22612 0.999512 7.00012 0.999512C3.68612 0.999512 1.00012 3.68651 1.00012 6.99951C1.00012 10.3135 3.68612 12.9995 7.00012 12.9995C8.65612 12.9995 10.1561 12.3275 11.2421 11.2425M29 0.999812L23 6.99981" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                
                {/* Brand Name */}
                <h1 
                  className={`text-6xl font-black`}
                  style={{
                    color: '#ff00ff',
                    filter: 'drop-shadow(0 0 2px #ff00ff) drop-shadow(0 0 4px rgba(255, 0, 255, 0.1))'
                  }}
                >
                  Pub Söcial
                </h1>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Commented out PUB subtitle */}
              {/* <span className={`text-xs font-semibold uppercase tracking-[0.5em] ${!isDark ? 'text-amber-500' : 'text-cyan-400'}`}>
                PUB
              </span> */}
              <p className={`text-base sm:text-lg ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                {barConfig.content.description}
              </p>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 space-y-6" isDark={isDark}>
              <div className="space-y-2 text-center">
                <p className={`text-xs font-semibold uppercase tracking-[0.4em] ${!isDark ? 'text-amber-500' : 'text-cyan-400'}`}>
                  {barConfig.content.tagline}
                </p>
                <h2 className={`text-3xl font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                  {barConfig.gameName}
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/host"
                  className={`group inline-flex items-center justify-center rounded-2xl px-6 py-4 text-lg font-semibold transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${!isDark ? barConfig.colors.buttons.startGame.light.gradient : barConfig.colors.buttons.startGame.dark.gradient} ${!isDark ? barConfig.colors.buttons.startGame.light.text : barConfig.colors.buttons.startGame.dark.text} ${!isDark ? barConfig.colors.buttons.startGame.light.shadow : barConfig.colors.buttons.startGame.dark.shadow} ${!isDark ? barConfig.colors.buttons.startGame.light.focus : barConfig.colors.buttons.startGame.dark.focus} ${!isDark ? barConfig.colors.buttons.startGame.light.hover : barConfig.colors.buttons.startGame.dark.hover}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {barConfig.buttons.startGame}
                  </span>
                </Link>
                <Link
                  to="/join"
                  className={`group inline-flex items-center justify-center rounded-2xl px-6 py-4 text-lg
                            font-semibold transition hover:scale-[1.02]
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                            ${!isDark ? barConfig.colors.buttons.joinGame.light.gradient : barConfig.colors.buttons.joinGame.dark.gradient} ${!isDark ? barConfig.colors.buttons.joinGame.light.text : barConfig.colors.buttons.joinGame.dark.text} ${!isDark ? barConfig.colors.buttons.joinGame.light.shadow : barConfig.colors.buttons.joinGame.dark.shadow} ${!isDark ? barConfig.colors.buttons.joinGame.light.focus : barConfig.colors.buttons.joinGame.dark.focus} ${!isDark ? barConfig.colors.buttons.joinGame.light.hover : barConfig.colors.buttons.joinGame.dark.hover}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {barConfig.buttons.joinGame}
                  </span>
                </Link>
              </div>
            </Card>

            <Card className={`space-y-4 ${!isDark ? 'bg-amber-50/60' : 'bg-slate-800/60'}`} isDark={isDark}>
              <p className={`text-xs font-bold uppercase tracking-[0.4em] ${!isDark ? 'text-amber-600' : 'text-cyan-400'}`}>
                Account
              </p>
              <Link
                to="/auth"
                className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${!isDark ? barConfig.colors.buttons.auth.light.border : barConfig.colors.buttons.auth.dark.border} ${!isDark ? barConfig.colors.buttons.auth.light.background : barConfig.colors.buttons.auth.dark.background} ${!isDark ? barConfig.colors.buttons.auth.light.text : barConfig.colors.buttons.auth.dark.text} ${!isDark ? barConfig.colors.buttons.auth.light.shadow : barConfig.colors.buttons.auth.dark.shadow} ${!isDark ? barConfig.colors.buttons.auth.light.hoverBorder : barConfig.colors.buttons.auth.dark.hoverBorder} ${!isDark ? barConfig.colors.buttons.auth.light.hoverBackground : barConfig.colors.buttons.auth.dark.hoverBackground} ${!isDark ? barConfig.colors.buttons.auth.light.hoverText : barConfig.colors.buttons.auth.dark.hoverText} ${!isDark ? barConfig.colors.buttons.auth.light.hoverShadow : barConfig.colors.buttons.auth.dark.hoverShadow} ${!isDark ? barConfig.colors.buttons.auth.light.hoverScale : barConfig.colors.buttons.auth.dark.hoverScale} ${!isDark ? barConfig.colors.buttons.auth.light.focus : barConfig.colors.buttons.auth.dark.focus}`}
              >
                {isGuest ? barConfig.buttons.createAccount : barConfig.buttons.signIn}
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

export default EntryPage;
