const uploadDrawing = require('./_upload-drawing');
const getDrawingUrl = require('./_get-drawing-url');

module.exports = async function handler(req, res) {
  if (req.url.includes('/api/upload-drawing')) return uploadDrawing(req, res);
  if (req.url.includes('/api/get-drawing-url')) return getDrawingUrl(req, res);
  
  return res.status(404).json({ success: false, error: 'Route not found in drawings router' });
};
