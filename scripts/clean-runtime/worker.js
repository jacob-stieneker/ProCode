importScripts('../angular/typescript.js', './analyzer.js');
self.onmessage = ({ data }) => {
  try {
    if (typeof data.source !== 'string' || data.source.length > 50000)
      throw Error('Keep source under 50,000 characters.');
    self.postMessage({ metrics: ProCodeClean.analyzeJavaScript(self.ts, data.source, data.entry) });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
