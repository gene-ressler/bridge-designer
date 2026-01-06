/** Hardware feature scanner. Pure Typescript because it's needed before Angular bootstraps. */
export type Browser =
  | 'Chrome'
  | 'Edge (chromium)'
  | 'Edge (legacy)'
  | 'Firefox'
  | 'Opera'
  | 'Safari'
  | 'Samsung'
  | 'unknown';

/** Browser features of interest to this app. */
export type BrowserFeatures = {
  addEventListener: boolean;
  async: boolean;
  browser: Browser;
  supportedBrowser: boolean;
  canvas: boolean;
  classList: boolean;
  localStorage: boolean;
  mouse: boolean;
  querySelectorAll: boolean;
  screenSize: string;
  supportedScreenSize: boolean;
  viewportUnits: boolean;
  webAssembly: boolean;
  webgl2: boolean;
};

/** Browsers we attempt to make trouble free in latest version. */
// Don't move below BROWSER_FEATURES decl.
const SUPPORTED_BROWSERS: Browser[] = ['Chrome', 'Edge (chromium)', 'Firefox', 'Opera'];

/** A report on whether needed features are present in the current browser. */
export const BROWSER_FEATURES: BrowserFeatures = getFeatures(document);

/** Features that must be present, else Bridge Designer is likely to fail or be unusable. */
type Mandatory =
  | 'addEventListener'
  | 'async'
  | 'canvas'
  | 'classList'
  | 'localStorage'
  | 'mouse'
  | 'querySelectorAll'
  | 'supportedBrowser'
  | 'supportedScreenSize'
  | 'viewportUnits'
  | 'webgl2'; // Mandatory as context is created eagerly whether fly-thru is requested or not.

/** Type to force feature table consistency. */
type MandatoryDescriptions<K extends keyof BrowserFeatures> = {
  [P in K]: string;
};

/**
 * Key for remembering what's aleady been reported to the user. Can't start with
 * `bridge-designer`, else it will be cleared by session state service.
 */
const LOCAL_STORAGE_KEY = 'browser-signature-v1';

/**
 * Returns true if features are missing and user acks, false if no features missing,
 * user wants to ignore, or the user has already seen a report of the same features.
 */
export function areBrowserFeaturesMissing(): boolean {
  // Don't concern the user if nothing changed since they cancelled last time.
  // NOTE: The URL GET /?reset param mechanism clears this, too, visible during the app load afterward.
  const previousFeaturesJson = BROWSER_FEATURES.localStorage && window.localStorage.getItem(LOCAL_STORAGE_KEY);
  const currentFeaturesJson = JSON.stringify(BROWSER_FEATURES);
  if (previousFeaturesJson !== null && previousFeaturesJson === currentFeaturesJson) {
    return false;
  }
  const mandatory: MandatoryDescriptions<Mandatory> = {
    addEventListener: 'HTML addEventListener',
    async: 'HTML async',
    canvas: 'HTML canvas',
    classList: 'HTML classList',
    localStorage: 'local storage',
    mouse: 'detectable mouse',
    querySelectorAll: 'HTML querySelectorAll',
    supportedScreenSize: 'screen size 1280x800 or higher',
    supportedBrowser: `a supported browser (found ${BROWSER_FEATURES.browser}, which is not)`,
    viewportUnits: 'CSS viewport units',
    webgl2: 'WebGL2 for fly-thru test animation',
  };
  const missing = Object.entries(mandatory)
    .filter(([feature, _]) => !BROWSER_FEATURES[feature as keyof BrowserFeatures])
    .map(([_, description]) => description);
  // Don't concern the user if no mandatory features are missing.
  if (missing.length === 0) {
    return false;
  }
  const wantsHelp = confirm(`Oops. Looks like your browser is missing some bits 
needed by the Bridge Designer:
${missing.map(item => ` - ${item}`).join('\n')}
This means likely problems or failure if you continue.

Click OK for information about Bridge Designer's 
browser requirements or Cancel to continue 
running Bridge Designer anyway.
 
NOTE: If you Cancel, this warning won't reappear unless something changes.`);
  if (!wantsHelp) {
    // User cancelled. Don't show dialog again until something changes.
    window.localStorage.setItem(LOCAL_STORAGE_KEY, currentFeaturesJson);
  }
  return wantsHelp;
}

/**
 * Probes the browser to see what it can do and returns a summary record.
 * Thanks to features.js for many of the ideas herein.
 */
function getFeatures(document: HTMLDocument): BrowserFeatures {
  const documentElement = document.documentElement;
  function create(elementName: string): HTMLElement {
    return document.createElement(elementName);
  }
  function hasMedia(spec: string) {
    return window.matchMedia(spec).matches;
  }
  const browser = classifyBrowser();
  return {
    addEventListener: !!window.addEventListener,
    async: 'async' in create('script'),
    browser,
    canvas: (() => {
      const canvas = create('canvas') as HTMLCanvasElement;
      return !!(canvas.getContext && canvas.getContext('2d'));
    })(),
    classList: 'classList' in documentElement,
    localStorage: (() => {
      try {
        const key = 'bd-test-tmp-to-be-removed';
        const val = 'x'.repeat(64 * 1024); // Estimated max.
        window.localStorage.setItem(key, val);
        window.localStorage.removeItem(key);
        return true;
      } catch (err) {
        return !!window.localStorage.length;
      }
    })(),
    mouse: !!hasMedia('(pointer: fine)') && hasMedia('(hover: hover)'),
    querySelectorAll: !!document.querySelectorAll,
    screenSize: `${screen.width}x${screen.height}`,
    supportedBrowser: SUPPORTED_BROWSERS.includes(browser),
    supportedScreenSize: screen.width >= 1280 && screen.height >= 800,
    viewportUnits: (() => {
      const element = create('dummy');
      try {
        element.style.width = '1vw';
        return element.style.width !== '';
      } catch (err) {
        return false;
      }
    })(),
    webAssembly: typeof WebAssembly !== 'undefined' && typeof WebAssembly.instantiate === 'function',
    webgl2: (() => {
      const canvas = create('canvas') as HTMLCanvasElement;
      return !!(canvas.getContext && canvas.getContext('webgl2'));
    })(),
  };
}

/** Parses the browser user agent string to determine what browser we're running. */
function classifyBrowser(): Browser {
  {
    const browsersByKeyword: Record<string, Browser> = {
      FireFox: 'Firefox',
      SamsungBrowser: 'Samsung',
      Opera: 'Opera',
      OPR: 'Opera',
      Edge: 'Edge (legacy)',
      Edg: 'Edge (chromium)',
      Chrome: 'Chrome',
      Safari: 'Safari',
    };
    const agent = window.navigator.userAgent;
    for (const [keyword, name] of Object.entries(browsersByKeyword)) {
      if (agent.includes(keyword)) {
        return name;
      }
    }
    return 'unknown';
  }
}
