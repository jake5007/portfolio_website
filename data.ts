export const navLinks = [
  {
    title: "About",
    path: "#about",
  },
  {
    title: "Work",
    path: "#work",
  },
  {
    title: "Hobbies",
    path: "#hobbies",
  },
  {
    title: "Contact",
    path: "#contact",
  },
];

type AboutTab = {
  id: string;
  title: string;
  content: AboutContentItem[];
};

type AboutContentItem = {
  label: string;
  value: string;
  detail?: string;
  period?: string;
};

export const aboutTabs: AboutTab[] = [
  {
    id: "skills",
    title: "Skills",
    content: [
      {
        label: "Test Automation",
        value: "Playwright · TypeScript · Python · E2E Testing · Page Object Model · GitHub Actions",
      },
      {
        label: "Software Testing",
        value: "Functional Testing · Regression Testing · Test Case Design · Defect Reporting",
      },
      {
        label: "Data Analysis & SQL",
        value: "SQL · Amazon Athena · Oracle Database · Data Validation",
      },
      {
        label: "Software Development",
        value: "JavaScript · React · Vue.js · Node.js · Git",
      },
    ],
  },
  {
    id: "education",
    title: "Education",
    content: [
      {
        label: "University",
        value: "Handong Global University",
        detail: "B.S. in Computer Engineering · B.A. in Management · Pohang, South Korea",
      },
      {
        label: "Certifications",
        value: "ISTQB Certified Tester Foundation Level (CTFL) · SQL Developer (SQLD) · Engineer Information Processing",
      },
      {
        label: "Professional Training",
        value: "Java & Spring Backend Development",
        detail: "Backend Developer Training Program · Busan, South Korea",
      },
    ],
  },
  {
    id: "experience",
    title: "Experience",
    content: [
      {
        label: "QA Engineer",
        value: "QOOD",
        period: "Jun 2026 – Present",
        detail: "Perform navigation software testing and SQL-based route analysis. Built Python and Playwright automation tools, reducing a repetitive reporting workflow from approximately 60 minutes to 2 minutes.",
      },
      {
        label: "Software Developer",
        value: "WITH Information",
        period: "Mar 2024 – Mar 2025",
        detail: "Developed and maintained web applications using Vue.js, JavaScript, C, and Oracle Database.",
      },
      {
        label: "Frontend Developer",
        value: "SAINTI Inc. (formerly SCADAICT)",
        period: "Sep 2022 – Mar 2023",
        detail: "Developed web-based manufacturing dashboards using Vue.js and Apache ECharts.",
      },
    ],
  },
  {
    id: "languages",
    title: "Languages",
    content: [
      { label: "Korean", value: "Native" },
      {
        label: "English",
        value: "IELTS GT 7.0",
        detail: "Professional working proficiency",
      },
      {
        label: "Polish",
        value: "Beginner",
        detail: "Currently learning",
      },
    ],
  },
];

export const workTabs = [
  {
    id: "all",
    title: "All",
  },
  {
    id: "dev",
    title: "Dev",
  },
  {
    id: "test",
    title: "Test",
  },
];

export const workList = [
  {
    id: 11,
    category: ["all", "test"],
    title: "Sauce Demo Playwright E2E Test",
    desc: "Automated end-to-end tests for SauceDemo using Playwright, TypeScript, and the Page Object Model, with Allure test reports.",
    imgSrc: "/images/work/saucedemo_playwright.png",
    gitURL: "https://github.com/jake5007/saucedemo-playwright-portfolio",
    liveURL: "https://jake5007.github.io/saucedemo-playwright-portfolio/",
  },
  {
    id: 10,
    category: ["all", "dev"],
    title: "Dessert List with Cart",
    desc: "Browse a selection of desserts and add your favorites to a shopping cart.",
    imgSrc: "/images/work/product_list_with_cart.png",
    gitURL: "https://github.com/jake5007/product-list-with-cart",
    liveURL: "https://product-list-with-cart-peach-mu.vercel.app/",
  },
  {
    id: 9,
    category: ["all", "dev"],
    title: "Icebreaker API",
    desc: "A public API that serves icebreaker questions by category or at random.",
    imgSrc: "/images/work/icebreaker_api.png",
    gitURL: "https://github.com/jake5007/icebreaker-api",
    liveURL: "https://icebreaker-api-us13.onrender.com/docs/",
  },
  {
    id: 8,
    category: ["all", "dev"],
    title: "Online Shop",
    desc: "An e-commerce application for browsing and purchasing products.",
    imgSrc: "/images/work/online_shop.png",
    gitURL: "https://github.com/jake5007/online-shop-pern",
    liveURL: "https://online-shop-pern.onrender.com/",
  },
  {
    id: 7,
    category: ["all", "dev"],
    title: "Memory Board",
    desc: "A web application for uploading and sharing memorable moments.",
    imgSrc: "/images/work/memory_board.png",
    gitURL: "https://github.com/jake5007/pj_memory_board",
    liveURL: "https://memory-board.onrender.com",
  },
  {
    id: 6,
    category: ["all", "dev"],
    title: "Meme Generator",
    desc: "Create memes using randomly fetched images.",
    imgSrc: "/images/work/meme_maker.png",
    gitURL: "https://github.com/jake5007/meme_maker",
    liveURL: "https://meme-maker-git-main-jake5007.vercel.app/",
  },
  {
    id: 5,
    category: ["all", "dev"],
    title: "Space Tourism Website",
    desc: "Explore an interactive website themed around space tourism.",
    imgSrc: "/images/work/space_tourism.png",
    gitURL: "https://github.com/jake5007/space-tourism-website",
    liveURL: "https://space-tourism-website-jake5007.vercel.app/",
  },
  {
    id: 4,
    category: ["all", "dev"],
    title: "Rock Paper Scissors Lizard Spock",
    desc: "Play Rock, Paper, Scissors, Lizard, Spock against the computer.",
    imgSrc: "/images/work/rpsls.png",
    gitURL: "https://github.com/jake5007/rock-paper-scissors-lizard-spock",
    liveURL: "https://creative-dragon-ccbb55.netlify.app/",
  },
  {
    id: 3,
    category: ["all", "dev"],
    title: "IP Address Tracker",
    desc: "Look up an IP address to view its approximate geographic location.",
    imgSrc: "/images/work/ip_address_tracker.png",
    gitURL: "https://github.com/jake5007/ip-address-tracker",
    liveURL: "https://ip-address-tracker-jake5007.vercel.app/",
  },

  {
    id: 2,
    category: ["all", "dev"],
    title: "Age Calculator",
    desc: "Enter your date of birth to calculate your age.",
    imgSrc: "/images/work/age_calculator.png",
    gitURL:
      "https://frontend-mentor-junior-age-calculator-jake5007.vercel.app/",
    liveURL:
      "https://frontend-mentor-junior-age-calculator-jake5007.vercel.app/",
  },

  {
    id: 1,
    category: ["all", "dev"],
    title: "Advice Generator",
    desc: "Generate a random piece of advice with a single click.",
    imgSrc: "/images/work/advice_generator.png",
    gitURL: "https://github.com/jake5007/advice-generator",
    liveURL: "https://advice-generator-jake5007.vercel.app/",
  },
];

export const hobbies = [
  {
    id: 1,
    title: "language exchange",
    desc: "Almost every Friday, I participate in a language exchange event. It's really enjoyable to connect with people from different countries, making new friends and sharing cultural experiences.",
    image: [
      "/images/hobbies/language_exchange/01.jpg",
      "/images/hobbies/language_exchange/02.jpg",
      "/images/hobbies/language_exchange/03.jpg",
      "/images/hobbies/language_exchange/04.jpg",
      "/images/hobbies/language_exchange/05.jpg",
      "/images/hobbies/language_exchange/06.jpg",
      "/images/hobbies/language_exchange/07.jpg",
      "/images/hobbies/language_exchange/08.jpg",
      "/images/hobbies/language_exchange/09.jpg",
      "/images/hobbies/language_exchange/10.jpg",
    ],
  },
  {
    id: 2,
    title: "travel & pictures",
    desc: "I love capturing moments through photography whenever I travel. So far, I've had the opportunity to explore Japan, Italy, Singapore, and Germany. One of my dreams is to visit every European country and capture the beauty of their landscapes in photographs someday.",
    image: [
      "/images/hobbies/travel/01.jpg",
      "/images/hobbies/travel/02.jpg",
      "/images/hobbies/travel/03.jpg",
      "/images/hobbies/travel/04.jpg",
      "/images/hobbies/travel/05.jpg",
      "/images/hobbies/travel/06.jpg",
      "/images/hobbies/travel/07.jpg",
      "/images/hobbies/travel/08.jpg",
      "/images/hobbies/travel/09.jpg",
      "/images/hobbies/travel/10.jpg",
      "/images/hobbies/travel/11.jpg",
      "/images/hobbies/travel/12.jpg",
    ],
  },
];

export const themes = [
  {
    name: "pastel",
    label: "Pastel",
    colors: ["#ffd8d8", "#b7e4c7", "#d8b4fe"],
  },
  {
    name: "night",
    label: "Night",
    colors: ["#0F172A", "#334155", "#64748B"],
  },
  {
    name: "autumn",
    label: "Autumn",
    colors: ["#D8B4A0", "#D27548", "#BA4A00"],
  },
  {
    name: "forest",
    label: "Forest",
    colors: ["#171212", "#2B4C3F", "#6BAA75"],
  },
  {
    name: "coffee",
    label: "Coffee",
    colors: ["#20161F", "#A67C58", "#807666"],
  },
  {
    name: "luxury",
    label: "Luxury",
    colors: ["#171618", "#B6862D", "#E2C697"],
  },
  {
    name: "valentine",
    label: "Valentine",
    colors: ["#E96D7B", "#FF8FAB", "#FFB3C6"],
  },
];
