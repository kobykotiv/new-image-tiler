import { useEffect } from 'react';

export function CarbonAds() {
  useEffect(() => {
    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = '//cdn.carbonads.com/carbon.js?serve=CESIVKJW&placement=your_site_name';
    script.id = '_carbonads_js';

    // Insert script
    const carbonContainer = document.getElementById('carbon-container');
    if (carbonContainer && !document.getElementById('_carbonads_js')) {
      carbonContainer.appendChild(script);
    }

    // Cleanup
    return () => {
      const existingScript = document.getElementById('_carbonads_js');
      if (existingScript) {
        existingScript.remove();
      }
      const existingAd = document.getElementById('carbonads');
      if (existingAd) {
        existingAd.remove();
      }
    };
  }, []);

  return (
    <div
      id="carbon-container"
      className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-[330px] text-left"
    />
  );
}
