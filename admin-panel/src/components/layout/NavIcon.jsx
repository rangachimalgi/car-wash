export default function NavIcon({ name }) {
  const iconStroke = 'currentColor'
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (name) {
    case 'chevronDown':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'customer':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h10M4 18h16" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'services':
      return (
        <svg {...common}>
          <path d="M4 7h16M7 7v10M17 7v10M6 17h12" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'addons':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'coverage':
      return (
        <svg {...common}>
          <path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'slots':
      return (
        <svg {...common}>
          <path d="M8 3v3M16 3v3M4.5 8h15" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'packages':
    case 'dailyCleaningServices':
      return (
        <svg {...common}>
          <path d="M5 7h14v12H5z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 7V5h6v2M8 12h8M8 16h5" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'orders':
      return (
        <svg {...common}>
          <path d="M6 7h12l-1 14H7L6 7z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 7a3 3 0 016 0" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'reviews':
      return (
        <svg {...common}>
          <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 20.8l1-6.1-4.4-4.3 6.1-.9L12 3z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'media':
      return (
        <svg {...common}>
          <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke={iconStroke} strokeWidth="2" />
          <path d="M10 9l6 3-6 3V9z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'employeesGroup':
      return (
        <svg {...common}>
          <path d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" stroke={iconStroke} strokeWidth="2" />
          <path d="M4 21a8 8 0 0116 0" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'employees':
      return (
        <svg {...common}>
          <path d="M16 8a4 4 0 10-8 0 4 4 0 008 0z" stroke={iconStroke} strokeWidth="2" />
          <path d="M6 21a6 6 0 0112 0" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'attendance':
      return (
        <svg {...common}>
          <path d="M8 3v3M16 3v3M4.5 8h15" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 13l2 2 4-4" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'inventory':
      return (
        <svg {...common}>
          <path d="M4 7l8-4 8 4-8 4-8-4z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 7v10l8 4 8-4V7" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 11v10" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'cash':
      return (
        <svg {...common}>
          <path d="M12 3v18M7 7h10a4 4 0 010 8H9a3 3 0 000 6h8" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M12 2v20M2 12h20" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}
