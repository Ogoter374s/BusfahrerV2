// Configuration utility to manage base URLs for API requests.
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Configuration utility to manage WBS URLs for specific services.
const WBS_URL = import.meta.env.VITE_WBS_URL;

export default BASE_URL;
export { WBS_URL };
